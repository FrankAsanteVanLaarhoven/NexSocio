"""Contract tests for identity registration and ZKP verification flow."""

import pytest
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