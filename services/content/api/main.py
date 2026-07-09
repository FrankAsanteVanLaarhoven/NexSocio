from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from nexus_common.observability.logging import configure_logging
from nexus_common.observability.middleware import RequestLoggingMiddleware
from services.content.api.routes import router
from services.content.infrastructure.config import Settings
from services.content.infrastructure.database import get_engine, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    engine = get_engine(settings.database_url)
    await init_db(engine)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    settings = Settings()
    configure_logging(settings.service_name)

    app = FastAPI(
        title="NEXSOCIO Content & Media Engine",
        description="Content ingestion, adaptation, and delivery",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.include_router(router, prefix="/api/v1")
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/api/v1/media/files",
        StaticFiles(directory=str(upload_path)),
        name="media-files",
    )

    return app


app = create_app()