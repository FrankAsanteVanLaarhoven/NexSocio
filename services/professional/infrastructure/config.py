from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "professional"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    identity_service_url: str = "http://localhost:8001"
    content_service_url: str = "http://localhost:8003"
    jwt_secret: str = "change-me-in-production"
    cors_origins: list[str] = ["http://localhost:3000"]
    public_api_url: str = "http://localhost:8004"
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_business_price_id: str | None = None
    stripe_corporate_price_id: str | None = None