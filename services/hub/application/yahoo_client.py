import asyncio
from typing import Any

import httpx

YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"
YAHOO_TRENDING = "https://query1.finance.yahoo.com/v1/finance/trending/US"
YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search"

DEFAULT_SYMBOLS = [
    "^GSPC",
    "^DJI",
    "^IXIC",
    "^FTSE",
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "NVDA",
    "META",
    "BTC-USD",
]

RANGE_MAP = {
    "1d": ("5m", "1d"),
    "5d": ("15m", "5d"),
    "1mo": ("1d", "1mo"),
    "3mo": ("1d", "3mo"),
    "6mo": ("1d", "6mo"),
    "1y": ("1d", "1y"),
    "5y": ("1wk", "5y"),
}


class YahooFinanceClient:
    def __init__(self, user_agent: str):
        self.headers = {"User-Agent": user_agent}

    async def _get(self, url: str, params: dict | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=12.0, headers=self.headers) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            return res.json()

    async def fetch_quote(self, symbol: str) -> dict[str, Any] | None:
        try:
            data = await self._get(f"{YAHOO_CHART}/{symbol}", {"interval": "1d", "range": "1d"})
            result = (data.get("chart") or {}).get("result") or []
            if not result:
                return None
            meta = result[0].get("meta") or {}
            prev = meta.get("chartPreviousClose") or meta.get("previousClose")
            price = meta.get("regularMarketPrice")
            if price is None:
                return None
            change = (price - prev) if prev else 0
            pct = (change / prev * 100) if prev else 0
            return {
                "symbol": meta.get("symbol", symbol),
                "name": meta.get("longName") or meta.get("shortName") or symbol,
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(pct), 2),
                "currency": meta.get("currency", "USD"),
                "market_state": meta.get("marketState", "UNKNOWN"),
                "exchange": meta.get("exchangeName", ""),
            }
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            return None

    async def fetch_quotes(self, symbols: list[str] | None = None) -> list[dict[str, Any]]:
        syms = symbols or DEFAULT_SYMBOLS
        results = await asyncio.gather(*[self.fetch_quote(s) for s in syms])
        return [r for r in results if r]

    async def fetch_history(self, symbol: str, range_key: str = "1mo") -> dict[str, Any]:
        interval, range_val = RANGE_MAP.get(range_key, ("1d", "1mo"))
        try:
            data = await self._get(
                f"{YAHOO_CHART}/{symbol}",
                {"interval": interval, "range": range_val},
            )
            result = (data.get("chart") or {}).get("result") or []
            if not result:
                return {"symbol": symbol, "name": symbol, "range": range_key, "points": [], "currency": "USD"}
            block = result[0]
            meta = block.get("meta") or {}
            timestamps = block.get("timestamp") or []
            closes = (
                (block.get("indicators") or {})
                .get("quote", [{}])[0]
                .get("close", [])
            )
            points = []
            for ts, close in zip(timestamps, closes):
                if close is not None:
                    points.append({
                        "time": ts,
                        "close": round(float(close), 2),
                    })
            return {
                "symbol": meta.get("symbol", symbol),
                "name": meta.get("longName") or meta.get("shortName") or symbol,
                "range": range_key,
                "currency": meta.get("currency", "USD"),
                "current_price": meta.get("regularMarketPrice"),
                "points": points,
            }
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            return {"symbol": symbol, "name": symbol, "range": range_key, "points": [], "currency": "USD"}

    async def fetch_trending(self, count: int = 12) -> list[dict[str, Any]]:
        try:
            data = await self._get(YAHOO_TRENDING, {"count": count})
            quotes = (
                (data.get("finance") or {})
                .get("result", [{}])[0]
                .get("quotes", [])
            )
            trending = []
            for q in quotes[:count]:
                sym = q.get("symbol")
                if not sym:
                    continue
                trending.append({
                    "symbol": sym,
                    "name": q.get("shortName") or sym,
                    "price": q.get("regularMarketPrice"),
                    "change_percent": q.get("regularMarketChangePercent"),
                })
            if trending:
                return trending
        except (httpx.HTTPError, KeyError, TypeError):
            pass
        return []

    async def fetch_news(self, query: str = "stock market", count: int = 15) -> list[dict[str, Any]]:
        try:
            data = await self._get(
                YAHOO_SEARCH,
                {"q": query, "quotesCount": 0, "newsCount": count},
            )
            items = []
            for n in (data.get("news") or [])[:count]:
                items.append({
                    "id": n.get("uuid", n.get("link", "")),
                    "title": n.get("title", ""),
                    "publisher": n.get("publisher", "Yahoo Finance"),
                    "link": n.get("link", ""),
                    "published_at": n.get("providerPublishTime"),
                    "related_tickers": n.get("relatedTickers", []),
                })
            return items
        except (httpx.HTTPError, KeyError, TypeError):
            return []