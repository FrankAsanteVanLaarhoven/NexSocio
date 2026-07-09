"""Contract tests for collaboration and notification services."""

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def notification_client():
    from services.notification.api.main import create_app
    from services.notification.infrastructure.config import Settings
    from services.notification.infrastructure.database import get_engine, init_db

    app = create_app()
    settings = Settings()
    engine = get_engine(settings.database_url)
    await init_db(engine)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_collaboration_health():
    from services.collaboration.api.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "collaboration"
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_notification_health():
    from services.notification.api.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "notification"
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_notification_create_and_inbox_requires_auth(notification_client):
    user_id = str(uuid.uuid4())
    create = await notification_client.post(
        "/api/v1/notifications",
        json={
            "user_id": user_id,
            "type": "test",
            "title": "Hello",
            "body": "Contract test",
        },
    )
    assert create.status_code == 200
    payload = create.json()
    assert payload["success"] is True
    assert payload["data"]["title"] == "Hello"

    inbox = await notification_client.get("/api/v1/inbox")
    assert inbox.status_code == 401