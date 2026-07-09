from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.robot_agent.infrastructure.models import Base


def get_engine(database_url: str):
    return create_async_engine(database_url, echo=False)


async def init_db(engine) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS robot_agent"))
        await conn.run_sync(Base.metadata.create_all)
        for col, col_type in [
            ("owner_display_name", "VARCHAR(64)"),
            ("persona_greeting", "TEXT"),
            ("is_active", "BOOLEAN DEFAULT FALSE"),
        ]:
            await conn.execute(
                text(f"ALTER TABLE robot_agent.digital_twins ADD COLUMN IF NOT EXISTS {col} {col_type}")
            )
        # Seed default twins if empty
        await conn.execute(text("""
            INSERT INTO robot_agent.digital_twins (id, agent_id, owner_id, name, status, safety_channel, social_status, capabilities)
            SELECT gen_random_uuid(), 'twin-001', '00000000-0000-0000-0000-000000000001', 'NEXSOCIO Explorer', 'standby', 'certified_stub_v1', 'available', 'navigation,sensing'
            WHERE NOT EXISTS (SELECT 1 FROM robot_agent.digital_twins WHERE agent_id = 'twin-001')
        """))
        await conn.execute(text("""
            INSERT INTO robot_agent.digital_twins (id, agent_id, owner_id, name, status, safety_channel, social_status, capabilities)
            SELECT gen_random_uuid(), 'twin-002', '00000000-0000-0000-0000-000000000001', 'Safety Monitor', 'online', 'certified_stub_v1', 'monitoring', 'safety,alerts'
            WHERE NOT EXISTS (SELECT 1 FROM robot_agent.digital_twins WHERE agent_id = 'twin-002')
        """))


def get_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(session_factory: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session