from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nexus_common.observability.logging import configure_logging
from nexus_common.observability.middleware import RequestLoggingMiddleware
from services.hub.api.routes import router
from services.hub.infrastructure.config import Settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = Settings()
    configure_logging(settings.service_name)

    app = FastAPI(
        title="NEXSOCIO Hub Service",
        description="Markets, news, events, and device intelligence",
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