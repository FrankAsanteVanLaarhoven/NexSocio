from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "hub"
    jwt_secret: str = "change-me-in-production"
    robot_service_url: str = "http://localhost:8006"
    safety_service_url: str = "http://localhost:8005"
    cors_origins: list[str] = ["http://localhost:3000"]
    yahoo_user_agent: str = "Mozilla/5.0 (compatible; NEXSOCIO-Hub/1.0)"