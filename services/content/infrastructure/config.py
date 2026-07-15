from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from nexus_common.domain.models import parse_cors_origins


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "content"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    identity_service_url: str = "http://localhost:8001"
    social_graph_service_url: str = "http://localhost:8002"
    safety_service_url: str = "http://localhost:8005"
    professional_service_url: str = "http://localhost:8004"
    cors_origins: list[str] = ["http://localhost:3000"]
    upload_dir: str = "uploads/content"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def validate_cors(cls, v):
        return parse_cors_origins(v)