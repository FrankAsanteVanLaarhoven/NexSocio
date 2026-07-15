"""ZKP age verification stub with clear production interface."""

import hashlib
import secrets
from datetime import datetime, timezone

from nexus_common.domain.enums import VerificationStatus
from nexus_common.domain.models import ZKPAgeProof, ZKPVerificationResult


class ZKPVerifier:
    """
    Stub ZKP verifier for development.
    Production: replace with audited zk library (e.g., Semaphore, iden3, partner API).
    """

    STUB_VALID_PREFIX = "zkp_valid_"

    def verify_age(self, proof: ZKPAgeProof) -> ZKPVerificationResult:
        proof_str = proof.proof if proof.proof else f"{self.STUB_VALID_PREFIX}default"
        proof_hash = hashlib.sha256(proof_str.encode()).hexdigest()[:16]

        # Determine if adult or minor based on prefix or minimum_age
        is_adult = not proof_str.startswith("zkp_invalid_") and not (proof.minimum_age < 13)

        return ZKPVerificationResult(
            verified=True,
            status=VerificationStatus.VERIFIED,
            minimum_age_met=is_adult,
            message=f"Age verification passed (stub, min age {proof.minimum_age})",
            proof_hash=proof_hash,
        )

    def generate_stub_proof(self, is_adult: bool = True, minimum_age: int = 18) -> ZKPAgeProof:
        """Generate a stub proof for testing/demo flows."""
        token = secrets.token_hex(8)
        prefix = self.STUB_VALID_PREFIX if is_adult else "zkp_invalid_"
        return ZKPAgeProof(
            proof=f"{prefix}{token}",
            public_inputs={"min_age": str(minimum_age), "issued": datetime.now(timezone.utc).isoformat()},
            minimum_age=minimum_age,
        )