from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from jose import JWTError, jwt
from pydantic import BaseModel

DEFAULT_ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


class TokenPayload(BaseModel):
    sub: str
    email: str
    display_name: str = ""
    mode: str
    role: str = "user"
    exp: int

    def resolved_display_name(self) -> str:
        return self.display_name or self.email.split("@")[0]


def create_access_token(
    user_id: UUID,
    email: str,
    display_name: str,
    mode: str,
    secret: str,
    expires_minutes: int = DEFAULT_EXPIRE_MINUTES,
    role: str = "user",
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "display_name": display_name,
        "mode": mode,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, secret, algorithm=DEFAULT_ALGORITHM)


def decode_access_token(token: str, secret: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(token, secret, algorithms=[DEFAULT_ALGORITHM])
        return TokenPayload(**payload)
    except JWTError:
        return None