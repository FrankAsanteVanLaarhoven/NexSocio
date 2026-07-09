from collections.abc import AsyncGenerator
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.commerce.infrastructure.models import Base, ProductModel

SEED_PRODUCTS = [
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "NEXSOCIO Hoodie",
        "description": "Premium black hoodie with cyan accent logo. Unisex fit.",
        "price": 45.0,
        "category": "apparel",
        "image_emoji": "👕",
        "stock": 24,
    },
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "Digital Twin Setup",
        "description": "One-time setup for your AI digital twin with voice briefing.",
        "price": 99.0,
        "category": "digital",
        "image_emoji": "◎",
        "stock": 999,
        "is_digital": True,
    },
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "Pro Analytics Pack",
        "description": "Monthly professional insights, viewers, and sales dashboard.",
        "price": 19.0,
        "category": "subscriptions",
        "image_emoji": "📊",
        "stock": 999,
        "is_digital": True,
    },
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "Live Stream Kit",
        "description": "Ring light, mic filter presets, and live rewards booster.",
        "price": 34.99,
        "category": "creator",
        "image_emoji": "🎙",
        "stock": 15,
    },
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "Marketplace Seller Badge",
        "description": "Verified seller badge for your professional profile.",
        "price": 12.0,
        "category": "digital",
        "image_emoji": "✦",
        "stock": 999,
        "is_digital": True,
    },
    {
        "seller_id": UUID("00000000-0000-0000-0000-000000000001"),
        "seller_name": "NEXSOCIO Store",
        "title": "NEXSOCIO Cap",
        "description": "Structured cap with embroidered NS mark.",
        "price": 22.0,
        "category": "apparel",
        "image_emoji": "🧢",
        "stock": 40,
    },
]


def get_engine(database_url: str):
    return create_async_engine(database_url, echo=False)


async def init_db(engine, default_balance: float = 150.0) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS commerce"))
        await conn.run_sync(Base.metadata.create_all)

    async with async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)() as session:
        result = await session.execute(select(ProductModel).limit(1))
        if result.scalar_one_or_none() is None:
            for item in SEED_PRODUCTS:
                session.add(ProductModel(**item))
            await session.commit()


def get_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(session_factory: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session