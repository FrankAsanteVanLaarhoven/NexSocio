from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "notification"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    cors_origins: list[str] = ["http://localhost:3000"]