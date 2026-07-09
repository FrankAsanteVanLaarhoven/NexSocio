from typing import Annotated

from fastapi import APIRouter, Depends, Query
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.hub.api.deps import get_hub_service, get_settings, get_valid_token
from services.hub.application.dtos import (
    DeviceStatus,
    HubDashboardResponse,
    MapEvent,
    MarketHistory,
    MarketQuote,
    NewsItem,
    TrendingItem,
)
from services.hub.application.services import HubService
from services.hub.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/dashboard", response_model=ApiResponse[HubDashboardResponse])
async def dashboard(
    service: Annotated[HubService, Depends(get_hub_service)],
    token: Annotated[str | None, Depends(get_valid_token)] = None,
) -> ApiResponse[HubDashboardResponse]:
    data = await service.get_dashboard(token)
    return ApiResponse(data=data)


@router.get("/markets", response_model=ApiResponse[list[MarketQuote]])
async def markets(
    service: Annotated[HubService, Depends(get_hub_service)],
    symbols: str | None = Query(default=None, description="Comma-separated symbols"),
) -> ApiResponse[list[MarketQuote]]:
    sym_list = [s.strip() for s in symbols.split(",")] if symbols else None
    data = await service.get_markets(sym_list)
    return ApiResponse(data=data)


@router.get("/markets/{symbol}/history", response_model=ApiResponse[MarketHistory])
async def market_history(
    symbol: str,
    service: Annotated[HubService, Depends(get_hub_service)],
    range: str = Query(default="1mo", pattern=r"^(1d|5d|1mo|3mo|6mo|1y|5y)$"),
) -> ApiResponse[MarketHistory]:
    data = await service.get_history_or_404(symbol, range)
    return ApiResponse(data=data)


@router.get("/trending", response_model=ApiResponse[list[TrendingItem]])
async def trending(
    service: Annotated[HubService, Depends(get_hub_service)],
) -> ApiResponse[list[TrendingItem]]:
    data = await service.get_trending()
    return ApiResponse(data=data)


@router.get("/news", response_model=ApiResponse[list[NewsItem]])
async def news(
    service: Annotated[HubService, Depends(get_hub_service)],
    q: str = Query(default="stock market"),
) -> ApiResponse[list[NewsItem]]:
    data = await service.get_news(q)
    return ApiResponse(data=data)


@router.get("/events", response_model=ApiResponse[list[MapEvent]])
async def events(
    service: Annotated[HubService, Depends(get_hub_service)],
) -> ApiResponse[list[MapEvent]]:
    return ApiResponse(data=service.get_events())


@router.get("/devices", response_model=ApiResponse[list[DeviceStatus]])
async def devices(
    service: Annotated[HubService, Depends(get_hub_service)],
    token: Annotated[str | None, Depends(get_valid_token)] = None,
) -> ApiResponse[list[DeviceStatus]]:
    data = await service.get_devices(token)
    return ApiResponse(data=data)