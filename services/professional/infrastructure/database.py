from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.professional.infrastructure.models import Base


def get_engine(database_url: str):
    return create_async_engine(database_url, echo=False)


_CORPORATE_ORG_COLUMNS = [
    ("sector_category", "VARCHAR(64)"),
    ("corporate_email", "VARCHAR(256)"),
    ("email_domain", "VARCHAR(128)"),
    ("email_verified", "BOOLEAN DEFAULT FALSE"),
    ("credentials_verified", "BOOLEAN DEFAULT FALSE"),
    ("can_serve_public", "BOOLEAN DEFAULT FALSE"),
]

_SUBSCRIPTION_STRIPE_COLUMNS = [
    ("stripe_customer_id", "VARCHAR(128)"),
    ("stripe_subscription_id", "VARCHAR(128)"),
]


async def init_db(engine) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS professional"))
        await conn.run_sync(Base.metadata.create_all)
        for col, typedef in _CORPORATE_ORG_COLUMNS:
            await conn.execute(
                text(f"ALTER TABLE professional.organizations ADD COLUMN IF NOT EXISTS {col} {typedef}")
            )
        for table in ("business_subscriptions", "org_subscriptions"):
            for col, typedef in _SUBSCRIPTION_STRIPE_COLUMNS:
                await conn.execute(
                    text(
                        f"ALTER TABLE professional.{table} ADD COLUMN IF NOT EXISTS {col} {typedef}"
                    )
                )


def get_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(session_factory: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session