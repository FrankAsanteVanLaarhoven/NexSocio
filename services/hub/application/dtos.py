from pydantic import BaseModel, Field


class MarketQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    currency: str = "USD"
    market_state: str = ""
    exchange: str = ""


class HistoryPoint(BaseModel):
    time: int
    close: float


class MarketHistory(BaseModel):
    symbol: str
    name: str
    range: str
    currency: str = "USD"
    current_price: float | None = None
    points: list[HistoryPoint]


class TrendingItem(BaseModel):
    symbol: str
    name: str
    price: float | None = None
    change_percent: float | None = None


class NewsItem(BaseModel):
    id: str
    title: str
    publisher: str
    link: str
    published_at: int | None = None
    related_tickers: list[str] = []


class MapEvent(BaseModel):
    id: str
    title: str
    category: str
    city: str
    lat: float
    lng: float
    starts_at: str
    status: str = "upcoming"


class DeviceStatus(BaseModel):
    id: str
    name: str
    type: str
    status: str
    detail: str
    last_seen: str | None = None


class PlaceResult(BaseModel):
    place_id: str
    name: str
    address: str
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    types: list[str] = []
    open_now: bool | None = None
    source: str = "google"
    post_id: str | None = None
    promoted_by: str | None = None


class DirectionsResult(BaseModel):
    summary: str
    distance: str
    duration: str
    steps: list[dict]
    polyline: str | None = None


class ArticlePreview(BaseModel):
    title: str
    content_html: str
    source_url: str
    publisher: str


class HubDashboardResponse(BaseModel):
    markets: list[MarketQuote]
    trending: list[TrendingItem]
    news: list[NewsItem]
    events: list[MapEvent]
    devices: list[DeviceStatus]
    promoted_places: list[PlaceResult] = []
    updated_at: str
    source: str = "yahoo_finance"