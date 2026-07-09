from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.content.infrastructure.models import Base


def get_engine(database_url: str):
    return create_async_engine(database_url, echo=False)


async def init_db(engine) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS content"))
        await conn.run_sync(Base.metadata.create_all)
        for stmt in [
            "ALTER TABLE content.posts ADD COLUMN IF NOT EXISTS context VARCHAR(32) DEFAULT 'personal'",
            "ALTER TABLE content.posts ADD COLUMN IF NOT EXISTS media_url VARCHAR(512)",
            "ALTER TABLE content.posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(32) DEFAULT 'approved'",
        ]:
            await conn.execute(text(stmt))


def get_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(session_factory: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session