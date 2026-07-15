"""Contract tests for identity registration and ZKP verification flow."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from nexus_common.security.zkp import ZKPVerifier


@pytest.fixture
def zkp_verifier():
    return ZKPVerifier()


def test_stub_proof_adult_passes(zkp_verifier):
    proof = zkp_verifier.generate_stub_proof(is_adult=True)
    result = zkp_verifier.verify_age(proof)
    assert result.verified is True
    assert result.minimum_age_met is True


def test_stub_proof_minor_fails(zkp_verifier):
    proof = zkp_verifier.generate_stub_proof(is_adult=False)
    result = zkp_verifier.verify_age(proof)
    assert result.verified is True
    assert result.minimum_age_met is False


@pytest.mark.asyncio
async def test_identity_health():
    from services.identity.api.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "identity"
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_content_health():
    from services.content.api.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["service"] == "content"


@pytest_asyncio.fixture
async def identity_client():
    from services.identity.api.main import app
    from services.identity.infrastructure.config import Settings
    from services.identity.infrastructure.database import get_engine, init_db

    settings = Settings()
    engine = get_engine(settings.database_url)
    await init_db(engine)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_admin_permissions_and_suspension(identity_client):
    # 1. Register a standard user
    from nexus_common.security.zkp import ZKPVerifier
    import uuid
    email = f"moderator_test_{uuid.uuid4()}@example.com"
    zkp = ZKPVerifier()
    proof = zkp.generate_stub_proof(is_adult=True)
    
    reg_response = await identity_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "securepassword123",
            "display_name": "ModTest",
            "age_proof": proof.model_dump()
        }
    )
    assert reg_response.status_code == 200
    reg_data = reg_response.json()["data"]
    token = reg_data["access_token"]
    user_id = reg_data["user_id"]

    # 2. Try to access admin users list using the standard token (should be 403)
    admin_list_res = await identity_client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert admin_list_res.status_code == 403

    # 3. Elevate user role to admin directly in the database
    from services.identity.infrastructure.database import get_engine, get_session_factory
    from services.identity.infrastructure.config import Settings
    from services.identity.infrastructure.models import UserModel
    from sqlalchemy import select

    settings = Settings()
    engine = get_engine(settings.database_url)
    session_factory = get_session_factory(engine)
    
    async with session_factory() as session:
        result = await session.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalar_one()
        user.role = "admin"
        await session.commit()

    # 4. Log in again to get an admin token containing the admin role claim
    login_res = await identity_client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "securepassword123"
        }
    )
    assert login_res.status_code == 200
    admin_token = login_res.json()["data"]["access_token"]

    # 5. Access admin users list with admin token (should succeed)
    admin_list_res_2 = await identity_client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_list_res_2.status_code == 200
    members = admin_list_res_2.json()["data"]
    assert any(m["email"] == email for m in members)

    # 6. Suspend the user using the admin token
    suspend_res = await identity_client.patch(
        f"/api/v1/admin/users/{user_id}/status?status=suspended",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert suspend_res.status_code == 200

    # 7. Try to log in as the suspended user (should be 403)
    login_fail_res = await identity_client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "securepassword123"
        }
    )
    assert login_fail_res.status_code == 403
    assert "suspended" in login_fail_res.json()["detail"]