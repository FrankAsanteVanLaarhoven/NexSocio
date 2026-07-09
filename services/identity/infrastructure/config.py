from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "identity"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    zkp_verification_mode: str = "stub"
    cors_origins: list[str] = ["http://localhost:3000"]
    public_site_url: str = "http://localhost:3000"
    webauthn_rp_id: str = "localhost"