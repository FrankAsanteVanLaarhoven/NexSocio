import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import bcrypt
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.enums import UserMode
from nexus_common.security.jwt import create_access_token
from nexus_common.security.zkp import ZKPVerifier
from services.identity.application.auth_dtos import (
    AuthLoginResponse,
    AvailableAuthMethods,
    BiometricLoginRequest,
    KidsFaceLoginRequest,
    EnrollBiometricRequest,
    EnrollPinRequest,
    EnrollWebAuthnRequest,
    KidsRegisterRequest,
    KidsRegisterResponse,
    LoginRequest,
    ParentalApprovalRequest,
    ParentalApprovalResponse,
    PinLoginRequest,
    WebAuthnChallengeResponse,
    WebAuthnLoginRequest,
)
from services.identity.infrastructure.models import (
    AuthChallengeModel,
    AuthFactorModel,
    ParentalApprovalModel,
    UserModel,
)


class AuthService:
    RP_ID = "localhost"

    def __init__(self, db: AsyncSession, jwt_secret: str, zkp_verifier: ZKPVerifier | None = None):
        self.db = db
        self.jwt_secret = jwt_secret
        self.zkp = zkp_verifier or ZKPVerifier()

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode(), password_hash.encode())

    def _hash_pin(self, pin: str) -> str:
        return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

    def _verify_pin(self, pin: str, pin_hash: str) -> bool:
        return bcrypt.checkpw(pin.encode(), pin_hash.encode())

    def _issue_token(self, user: UserModel, auth_method: str) -> AuthLoginResponse:
        token = create_access_token(
            user.id, user.email, user.display_name, user.mode, self.jwt_secret
        )
        return AuthLoginResponse(
            user_id=user.id,
            email=user.email,
            display_name=user.display_name,
            mode=UserMode(user.mode),
            age_verified=user.age_verified,
            access_token=token,
            auth_method=auth_method,
        )

    async def _get_user_by_email(self, email: str) -> UserModel | None:
        result = await self.db.execute(select(UserModel).where(UserModel.email == email))
        return result.scalar_one_or_none()

    async def login_password(self, request: LoginRequest) -> AuthLoginResponse:
        user = await self._get_user_by_email(request.email)
        if not user or not self._verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return self._issue_token(user, "password")

    async def login_pin(self, request: PinLoginRequest) -> AuthLoginResponse:
        user = await self._get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or PIN")

        result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.user_id == user.id,
                AuthFactorModel.factor_type == "pin",
            )
        )
        factor = result.scalar_one_or_none()
        if not factor or not factor.secret_hash or not self._verify_pin(request.pin, factor.secret_hash):
            raise HTTPException(status_code=401, detail="Invalid email or PIN")
        return self._issue_token(user, "pin")

    async def login_kids_face(self, request: KidsFaceLoginRequest) -> AuthLoginResponse:
        result = await self.db.execute(
            select(UserModel).where(
                UserModel.display_name.ilike(request.display_name),
                UserModel.mode == UserMode.KIDS.value,
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="Face ID verification failed")

        factor_result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.user_id == user.id,
                AuthFactorModel.factor_type == "face",
                AuthFactorModel.template_hash == request.face_template_hash,
            )
        )
        if not factor_result.scalar_one_or_none():
            raise HTTPException(status_code=401, detail="Face ID verification failed")
        return self._issue_token(user, "face")

    async def login_biometric(self, request: BiometricLoginRequest) -> AuthLoginResponse:
        user = await self._get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=401, detail="Biometric verification failed")

        if request.factor_type == "voice" and request.voice_command:
            expected = "nexus unlock"
            if request.voice_command.strip().lower() != expected:
                raise HTTPException(status_code=401, detail="Voice command not recognized")

        result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.user_id == user.id,
                AuthFactorModel.factor_type == request.factor_type,
                AuthFactorModel.template_hash == request.template_hash,
            )
        )
        factor = result.scalar_one_or_none()
        if not factor:
            raise HTTPException(status_code=401, detail="Biometric verification failed")
        return self._issue_token(user, request.factor_type)

    async def _create_challenge(self, user_id: UUID | None = None, purpose: str = "webauthn") -> str:
        challenge = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(minutes=5)
        row = AuthChallengeModel(
            challenge=challenge,
            user_id=user_id,
            purpose=purpose,
            expires_at=expires,
        )
        self.db.add(row)
        await self.db.commit()
        return challenge

    async def _consume_challenge(self, challenge: str) -> AuthChallengeModel:
        result = await self.db.execute(
            select(AuthChallengeModel).where(
                AuthChallengeModel.challenge == challenge,
                AuthChallengeModel.consumed.is_(False),
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=400, detail="Invalid or expired challenge")
        if row.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Challenge expired")
        row.consumed = True
        await self.db.commit()
        return row

    async def webauthn_register_options(self, user_id: UUID) -> WebAuthnChallengeResponse:
        user = await self._get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        challenge = await self._create_challenge(user_id=user_id, purpose="webauthn_register")
        return WebAuthnChallengeResponse(
            challenge=challenge,
            rp_id=self.RP_ID,
            user_id=str(user.id),
            user_name=user.email,
            user_display_name=user.display_name,
        )

    async def webauthn_login_options(self, email: str) -> WebAuthnChallengeResponse:
        user = await self._get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.user_id == user.id,
                AuthFactorModel.factor_type == "webauthn",
            )
        )
        factors = result.scalars().all()
        if not factors:
            raise HTTPException(status_code=400, detail="No passkey enrolled for this account")

        challenge = await self._create_challenge(user_id=user.id, purpose="webauthn_login")
        return WebAuthnChallengeResponse(
            challenge=challenge,
            rp_id=self.RP_ID,
            allow_credentials=[
                {"id": f.credential_id, "type": "public-key"}
                for f in factors
                if f.credential_id
            ],
        )

    async def enroll_webauthn(self, user_id: UUID, request: EnrollWebAuthnRequest) -> None:
        await self._consume_challenge(request.challenge)
        factor = AuthFactorModel(
            user_id=user_id,
            factor_type="webauthn",
            credential_id=request.credential_id,
            label=request.label or "Passkey",
        )
        self.db.add(factor)
        await self.db.commit()

    async def login_webauthn(self, request: WebAuthnLoginRequest) -> AuthLoginResponse:
        challenge_row = await self._consume_challenge(request.challenge)

        result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.factor_type == "webauthn",
                AuthFactorModel.credential_id == request.credential_id,
            )
        )
        factor = result.scalar_one_or_none()
        if not factor:
            raise HTTPException(status_code=401, detail="Passkey not recognized")

        if request.email:
            user = await self._get_user_by_email(request.email)
            if not user or user.id != factor.user_id:
                raise HTTPException(status_code=401, detail="Passkey verification failed")
        else:
            user = await self._get_user(factor.user_id)

        if not user:
            raise HTTPException(status_code=401, detail="Passkey verification failed")
        if challenge_row.user_id and challenge_row.user_id != user.id:
            raise HTTPException(status_code=401, detail="Passkey verification failed")
        return self._issue_token(user, "webauthn")

    async def _get_user(self, user_id: UUID) -> UserModel | None:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()

    async def enroll_pin(self, user_id: UUID, request: EnrollPinRequest) -> None:
        result = await self.db.execute(
            select(AuthFactorModel).where(
                AuthFactorModel.user_id == user_id,
                AuthFactorModel.factor_type == "pin",
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.secret_hash = self._hash_pin(request.pin)
        else:
            self.db.add(
                AuthFactorModel(
                    user_id=user_id,
                    factor_type="pin",
                    secret_hash=self._hash_pin(request.pin),
                    label="6-digit PIN",
                )
            )
        await self.db.commit()

    async def enroll_biometric(self, user_id: UUID, request: EnrollBiometricRequest) -> None:
        self.db.add(
            AuthFactorModel(
                user_id=user_id,
                factor_type=request.factor_type,
                template_hash=request.template_hash,
                label=request.label or request.factor_type.title(),
            )
        )
        await self.db.commit()

    async def get_available_methods(self, email: str) -> AvailableAuthMethods:
        user = await self._get_user_by_email(email)
        if not user:
            return AvailableAuthMethods(email=email, methods=["password"])

        result = await self.db.execute(
            select(AuthFactorModel.factor_type).where(AuthFactorModel.user_id == user.id)
        )
        factors = {row[0] for row in result.all()}
        methods = ["password"]
        if "pin" in factors:
            methods.append("pin")
        if "webauthn" in factors:
            methods.append("webauthn")
        for bio in ("face", "palm", "voice"):
            if bio in factors:
                methods.append(bio)
        return AvailableAuthMethods(email=email, methods=methods)

    async def create_parental_approval(
        self, parent_user_id: UUID, request: ParentalApprovalRequest
    ) -> ParentalApprovalResponse:
        parent = await self._get_user(parent_user_id)
        if not parent or not parent.age_verified or parent.mode == UserMode.KIDS.value:
            raise HTTPException(
                status_code=403,
                detail="Only verified adult accounts can approve child registration",
            )

        code = f"{secrets.randbelow(1_000_000):06d}"
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        approval = ParentalApprovalModel(
            parent_user_id=parent_user_id,
            child_display_name=request.child_display_name,
            approval_code=code,
            expires_at=expires,
        )
        self.db.add(approval)
        await self.db.commit()
        return ParentalApprovalResponse(
            approval_code=code,
            child_display_name=request.child_display_name,
            expires_at=expires.isoformat(),
        )

    async def register_kids(self, request: KidsRegisterRequest) -> KidsRegisterResponse:
        zkp_result = self.zkp.verify_age(request.age_proof)
        if not zkp_result.verified:
            raise HTTPException(status_code=400, detail=zkp_result.message)
        if zkp_result.minimum_age_met:
            raise HTTPException(
                status_code=400,
                detail="Kids registration requires minor age verification. Use standard registration for adults.",
            )

        result = await self.db.execute(
            select(ParentalApprovalModel).where(
                ParentalApprovalModel.approval_code == request.parental_approval_code,
                ParentalApprovalModel.used.is_(False),
            )
        )
        approval = result.scalar_one_or_none()
        if not approval:
            raise HTTPException(status_code=400, detail="Invalid parental approval code")
        if approval.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Parental approval code expired")
        if approval.child_display_name.lower() != request.display_name.lower():
            raise HTTPException(
                status_code=400,
                detail="Display name must match the name on the parental approval",
            )

        user_id = uuid4()
        email = f"kid-{user_id.hex[:12]}@nexus.kids"
        password = secrets.token_urlsafe(16)

        user = UserModel(
            id=user_id,
            email=email,
            display_name=request.display_name,
            password_hash=self._hash_password(password),
            mode=UserMode.KIDS.value,
            age_verified=True,
            zkp_proof_hash=zkp_result.proof_hash,
            beta_cohort="kids_cohort",
        )
        self.db.add(user)

        self.db.add(
            AuthFactorModel(
                user_id=user_id,
                factor_type="face",
                template_hash=request.face_template_hash,
                label="Face ID",
            )
        )

        approval.used = True
        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token(
            user_id, email, request.display_name, UserMode.KIDS.value, self.jwt_secret
        )
        return KidsRegisterResponse(
            user_id=user_id,
            display_name=request.display_name,
            mode=UserMode.KIDS,
            access_token=token,
            zkp_result=zkp_result,
            parental_approved=True,
        )

    @staticmethod
    def hash_template(data: str) -> str:
        return hashlib.sha256(data.encode()).hexdigest()