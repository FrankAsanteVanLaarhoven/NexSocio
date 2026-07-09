from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "robot-agent"
    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    jwt_secret: str = "change-me-in-production"
    safety_service_url: str = "http://localhost:8005"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Safety-certified command allowlist
    allowed_commands: list[str] = [
        "move", "stop", "scan", "greet", "status", "return_home", "alert",
    ]