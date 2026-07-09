from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "collaboration"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    social_graph_service_url: str = "http://localhost:8002"
    notification_service_url: str = "http://localhost:8010"
    cors_origins: list[str] = ["http://localhost:3000"]