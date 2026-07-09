"""Minimal stub service factory for bounded contexts not yet fully implemented."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nexus_common.domain.models import HealthResponse
from nexus_common.observability.logging import configure_logging
from nexus_common.observability.middleware import RequestLoggingMiddleware


def create_stub_app(service_name: str, description: str, port: int) -> FastAPI:
    configure_logging(service_name)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield

    app = FastAPI(title=f"NEXSOCIO {service_name}", description=description, version="1.0.0", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/api/v1/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(service=service_name)

    @app.get("/api/v1/status")
    async def status():
        return {"service": service_name, "status": "stub", "port": port}

    return app