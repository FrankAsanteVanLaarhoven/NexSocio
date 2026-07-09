import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PostModel(Base):
    __tablename__ = "posts"
    __table_args__ = {"schema": "content"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    author_name: Mapped[str] = mapped_column(String(64), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    context: Mapped[str] = mapped_column(String(32), nullable=False, default="personal")
    visibility: Mapped[str] = mapped_column(String(32), nullable=False, default="public")
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    moderation_status: Mapped[str] = mapped_column(String(32), nullable=False, default="approved")
    post_type: Mapped[str] = mapped_column(String(16), nullable=False, default="text")
    filter_preset: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_twin_post: Mapped[bool] = mapped_column(Boolean, default=False)
    twin_agent_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    hide_ai_tag: Mapped[bool] = mapped_column(Boolean, default=False)
    place_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    place_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    place_address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    place_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    place_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_label: Mapped[str | None] = mapped_column(String(128), nullable=True)
    location_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_live_session: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CommentModel(Base):
    __tablename__ = "comments"
    __table_args__ = {"schema": "content"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    author_name: Mapped[str] = mapped_column(String(64), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    moderation_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())