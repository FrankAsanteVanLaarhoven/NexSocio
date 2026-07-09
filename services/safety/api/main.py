from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nexus_common.observability.logging import configure_logging
from nexus_common.observability.middleware import RequestLoggingMiddleware
from nexus_common.observability.tracing import configure_tracing
from services.safety.api.routes import router
from services.safety.infrastructure.config import Settings
from services.safety.infrastructure.database import get_engine, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    engine = get_engine(settings.database_url)
    await init_db(engine)
    yield


def create_app() -> FastAPI:
    settings = Settings()
    configure_logging(settings.service_name)
    configure_tracing(settings.service_name)

    app = FastAPI(
        title="NEXSOCIO Safety, Moderation & Governance",
        description="Multi-layer safety: deterministic rules + ML stub",
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

    return app


app = create_app()