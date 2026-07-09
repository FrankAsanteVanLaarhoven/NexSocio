from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.enums import ContentVisibility, FeedType, UserMode, ViewContext
from nexus_common.safety.moderation import ModerationEngine
from services.content.application.ai_compose import compose_with_ai
from services.content.application.dtos import (
    AIComposeRequest,
    AIComposeResponse,
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    FeedResponse,
    PostResponse,
)
from services.content.infrastructure.config import Settings
from services.content.infrastructure.models import CommentModel, PostModel


class ContentService:
    def __init__(self, db: AsyncSession, settings: Settings | None = None):
        self.db = db
        self.settings = settings or Settings()
        self._moderator = ModerationEngine()

    async def _moderate(self, text: str, mode: UserMode, post_id: UUID | None = None) -> None:
        # Local fast path
        result = self._moderator.analyze(text, mode.value)
        if not result.allowed:
            raise HTTPException(status_code=400, detail=result.message)
        # Async safety service logging
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    f"{self.settings.safety_service_url}/api/v1/moderate",
                    json={"text": text, "author_mode": mode.value, "content_id": str(post_id) if post_id else None},
                )
        except httpx.HTTPError:
            pass

    async def _can_hide_ai_tag(self, token: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.settings.identity_service_url}/api/v1/users/me",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    return bool(data.get("can_hide_ai_tag"))
        except httpx.HTTPError:
            pass
        return False

    async def compose_ai(self, request: AIComposeRequest) -> AIComposeResponse:
        composed = compose_with_ai(request.draft, request.tone, request.context)
        return AIComposeResponse(composed=composed)

    async def create_post(
        self,
        author_id: UUID,
        author_name: str,
        mode: UserMode,
        request: CreatePostRequest,
        token: str | None = None,
    ) -> PostResponse:
        post_id = uuid4()
        body = request.body
        display_name = author_name
        is_ai = request.ai_assisted
        hide_tag = False
        if is_ai:
            hide_tag = request.hide_ai_tag and token and await self._can_hide_ai_tag(token)
        if request.is_twin_post and request.owner_display_name:
            display_name = f"🤖 Twin of {request.owner_display_name}"
            if not body.startswith("🤖"):
                body = (
                    f"🤖 Digital twin of {request.owner_display_name} — "
                    f"{request.owner_display_name} is busy right now. I'm here to help.\n\n{body}"
                )

        await self._moderate(body, mode, post_id)

        post = PostModel(
            id=post_id,
            author_id=author_id,
            author_name=display_name,
            body=body,
            mode=mode.value,
            context=request.context.value,
            visibility=request.visibility.value,
            media_url=request.media_url,
            moderation_status="approved",
            post_type=request.post_type,
            filter_preset=request.filter_preset,
            is_twin_post=request.is_twin_post,
            twin_agent_id=request.twin_agent_id,
            is_ai_generated=is_ai,
            hide_ai_tag=hide_tag,
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        return self._to_response(post)

    async def _get_connection_ids(self, user_id: UUID, token: str) -> list[UUID]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.settings.social_graph_service_url}/api/v1/connections/ids",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    return [UUID(uid) for uid in data.get("user_ids", [])]
        except (httpx.HTTPError, ValueError):
            pass
        return [user_id]

    async def get_feed(
        self,
        feed_type: FeedType = FeedType.GLOBAL,
        context: ViewContext = ViewContext.PERSONAL,
        mode: UserMode | None = None,
        user_id: UUID | None = None,
        token: str | None = None,
        limit: int = 50,
    ) -> FeedResponse:
        query = select(PostModel).order_by(PostModel.created_at.desc()).limit(limit)

        if feed_type == FeedType.PROFESSIONAL or context == ViewContext.PROFESSIONAL:
            query = query.where(PostModel.context == ViewContext.PROFESSIONAL.value)
        else:
            query = query.where(PostModel.context == ViewContext.PERSONAL.value)

        if mode:
            query = query.where(PostModel.mode == mode.value)

        if feed_type == FeedType.CONNECTIONS and user_id and token:
            connection_ids = await self._get_connection_ids(user_id, token)
            query = query.where(PostModel.author_id.in_(connection_ids))

        result = await self.db.execute(query)
        posts = result.scalars().all()

        count_query = select(func.count()).select_from(PostModel)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return FeedResponse(
            posts=[self._to_response(p) for p in posts],
            total=total,
            feed_type=feed_type.value,
            context=context.value,
        )

    async def create_comment(
        self,
        author_id: UUID,
        author_name: str,
        mode: UserMode,
        request: CreateCommentRequest,
    ) -> CommentResponse:
        self._moderator.analyze(request.body, mode.value)
        status = "pending"

        comment = CommentModel(
            id=uuid4(),
            post_id=request.post_id,
            author_id=author_id,
            author_name=author_name,
            body=request.body,
            moderation_status=status,
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return self._to_comment(comment)

    async def get_comments(self, post_id: UUID, include_pending: bool = False) -> list[CommentResponse]:
        query = select(CommentModel).where(CommentModel.post_id == post_id)
        if not include_pending:
            query = query.where(CommentModel.moderation_status == "approved")
        query = query.order_by(CommentModel.created_at.asc())
        result = await self.db.execute(query)
        return [self._to_comment(c) for c in result.scalars().all()]

    def _to_comment(self, comment: CommentModel) -> CommentResponse:
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            body=comment.body,
            moderation_status=comment.moderation_status,
            created_at=comment.created_at,
        )

    def _to_response(self, post: PostModel) -> PostResponse:
        return PostResponse(
            id=post.id,
            author_id=post.author_id,
            author_name=post.author_name,
            body=post.body,
            mode=UserMode(post.mode),
            context=ViewContext(post.context) if post.context else ViewContext.PERSONAL,
            visibility=ContentVisibility(post.visibility),
            media_url=post.media_url,
            moderation_status=post.moderation_status,
            post_type=getattr(post, "post_type", None) or "text",
            filter_preset=getattr(post, "filter_preset", None),
            is_twin_post=getattr(post, "is_twin_post", False) or False,
            twin_agent_id=getattr(post, "twin_agent_id", None),
            is_ai_generated=getattr(post, "is_ai_generated", False) or False,
            show_ai_tag=(getattr(post, "is_ai_generated", False) or False)
            and not (getattr(post, "hide_ai_tag", False) or False),
            created_at=post.created_at,
        )