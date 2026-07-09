from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import HTTPException

from services.hub.application.dtos import (
    DeviceStatus,
    HubDashboardResponse,
    MapEvent,
    MarketHistory,
    MarketQuote,
    NewsItem,
    TrendingItem,
)
from services.hub.application.yahoo_client import YahooFinanceClient
from services.hub.infrastructure.config import Settings

WORLD_EVENTS = [
    {"id": "mkt-ny", "title": "NYSE Market Open", "category": "market", "city": "New York", "lat": 40.71, "lng": -74.01, "hour": 9, "minute": 30, "tz": "America/New_York"},
    {"id": "mkt-lon", "title": "LSE Trading Session", "category": "market", "city": "London", "lat": 51.51, "lng": -0.09, "hour": 8, "minute": 0, "tz": "Europe/London"},
    {"id": "mkt-tky", "title": "TSE Closing Bell", "category": "market", "city": "Tokyo", "lat": 35.68, "lng": 139.69, "hour": 15, "minute": 0, "tz": "Asia/Tokyo"},
    {"id": "tech-sf", "title": "NEXSOCIO Tech Summit", "category": "social", "city": "San Francisco", "lat": 37.77, "lng": -122.42, "hour": 18, "minute": 0, "tz": "America/Los_Angeles"},
    {"id": "twin-live", "title": "Digital Twin Live Stream", "category": "nexsocio", "city": "Lagos", "lat": 6.52, "lng": 3.38, "hour": 14, "minute": 0, "tz": "Africa/Lagos"},
]


class HubService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.yahoo = YahooFinanceClient(settings.yahoo_user_agent)

    async def get_markets(self, symbols: list[str] | None = None) -> list[MarketQuote]:
        raw = await self.yahoo.fetch_quotes(symbols)
        return [MarketQuote(**q) for q in raw]

    async def get_history(self, symbol: str, range_key: str = "1mo") -> MarketHistory:
        raw = await self.yahoo.fetch_history(symbol, range_key)
        return MarketHistory(**raw)

    async def get_trending(self) -> list[TrendingItem]:
        raw = await self.yahoo.fetch_trending()
        enriched = []
        for item in raw:
            if item.get("price") is None:
                q = await self.yahoo.fetch_quote(item["symbol"])
                if q:
                    item["price"] = q["price"]
                    item["change_percent"] = q["change_percent"]
            enriched.append(TrendingItem(**item))
        return enriched

    async def get_news(self, query: str = "stock market") -> list[NewsItem]:
        raw = await self.yahoo.fetch_news(query)
        return [NewsItem(**n) for n in raw]

    def get_events(self) -> list[MapEvent]:
        now = datetime.now(timezone.utc)
        events = []
        for e in WORLD_EVENTS:
            events.append(
                MapEvent(
                    id=e["id"],
                    title=e["title"],
                    category=e["category"],
                    city=e["city"],
                    lat=e["lat"],
                    lng=e["lng"],
                    starts_at=now.isoformat(),
                    status="live" if e["category"] == "market" else "upcoming",
                )
            )
        return events

    async def get_devices(self, token: str | None = None) -> list[DeviceStatus]:
        devices: list[DeviceStatus] = []
        now = datetime.now(timezone.utc).isoformat()

        devices.append(
            DeviceStatus(
                id="hub-feed",
                name="Hub Live Feed",
                type="data",
                status="online",
                detail="Yahoo Finance real-time",
                last_seen=now,
            )
        )

        if token:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get(
                        f"{self.settings.robot_service_url}/api/v1/dashboard",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if res.status_code == 200:
                        data = res.json().get("data", {})
                        for twin in data.get("twins", []):
                            devices.append(
                                DeviceStatus(
                                    id=twin.get("agent_id", "twin"),
                                    name=twin.get("name", "Digital Twin"),
                                    type="digital_twin",
                                    status="online" if twin.get("is_active") else twin.get("status", "standby"),
                                    detail=twin.get("social_status", "available"),
                                    last_seen=now,
                                )
                            )
            except httpx.HTTPError:
                pass

            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{self.settings.safety_service_url}/api/v1/dashboard")
                    if res.status_code == 200:
                        data = res.json().get("data", {})
                        devices.append(
                            DeviceStatus(
                                id="safety-monitor",
                                name="Safety Monitor",
                                type="safety",
                                status="online",
                                detail=f"{data.get('open_reports', 0)} open reports",
                                last_seen=now,
                            )
                        )
            except httpx.HTTPError:
                pass

        return devices

    async def get_dashboard(self, token: str | None = None) -> HubDashboardResponse:
        markets, trending, news, events, devices = await self._gather_dashboard(token)
        return HubDashboardResponse(
            markets=markets,
            trending=trending,
            news=news,
            events=events,
            devices=devices,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )

    async def _gather_dashboard(self, token: str | None):
        import asyncio

        markets_task = self.get_markets()
        trending_task = self.get_trending()
        news_task = self.get_news()
        devices_task = self.get_devices(token)
        events = self.get_events()

        markets, trending, news, devices = await asyncio.gather(
            markets_task, trending_task, news_task, devices_task
        )
        return markets, trending, news, events, devices

    async def get_history_or_404(self, symbol: str, range_key: str) -> MarketHistory:
        hist = await self.get_history(symbol, range_key)
        if not hist.points:
            raise HTTPException(status_code=404, detail=f"No history for {symbol}")
        return hist