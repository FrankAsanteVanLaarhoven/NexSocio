from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.notification.infrastructure.models import Base


def get_engine(database_url: str):
    return create_async_engine(database_url, echo=False)


async def init_db(engine) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS notification"))
        await conn.run_sync(Base.metadata.create_all)


def get_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(session_factory: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session