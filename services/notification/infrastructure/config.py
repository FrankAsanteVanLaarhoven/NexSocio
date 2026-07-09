from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "notification"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    cors_origins: list[str] = ["http://localhost:3000"]
    vapid_public_key: str = (
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
    )
    vapid_private_key: str = "UUxI4O8-FbRouAevSmBQ6o18hgj4fZePrNiMKQsW1Iw"
    vapid_claims_email: str = "mailto:admin@nexsocio.app"
    web_push_enabled: bool = True