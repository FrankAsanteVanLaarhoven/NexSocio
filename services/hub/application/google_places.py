from typing import Any

import httpx

PLACES_BASE = "https://maps.googleapis.com/maps/api/place"
DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions/json"


class GooglePlacesClient:
    def __init__(self, api_key: str | None):
        self.api_key = api_key

    def _enabled(self) -> bool:
        return bool(self.api_key)

    async def text_search(self, query: str, lat: float | None = None, lng: float | None = None) -> list[dict[str, Any]]:
        if not self._enabled():
            return self._demo_places(query)
        params: dict[str, Any] = {"query": query, "key": self.api_key}
        if lat is not None and lng is not None:
            params["location"] = f"{lat},{lng}"
            params["radius"] = 5000
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(f"{PLACES_BASE}/textsearch/json", params=params)
            res.raise_for_status()
            data = res.json()
        return [self._normalize_place(p) for p in data.get("results", [])[:15]]

    async def nearby(
        self,
        lat: float,
        lng: float,
        place_type: str = "restaurant",
        radius: int = 2000,
    ) -> list[dict[str, Any]]:
        if not self._enabled():
            return self._demo_nearby(lat, lng, place_type)
        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "type": place_type,
            "key": self.api_key,
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(f"{PLACES_BASE}/nearbysearch/json", params=params)
            res.raise_for_status()
            data = res.json()
        return [self._normalize_place(p) for p in data.get("results", [])[:20]]

    async def directions(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        mode: str = "driving",
    ) -> dict[str, Any]:
        if not self._enabled():
            return {
                "summary": "Demo directions — add GOOGLE_MAPS_API_KEY for live navigation",
                "distance": "1.2 km",
                "duration": "8 mins",
                "steps": [
                    {"instruction": "Head north on Main St", "distance": "400 m"},
                    {"instruction": "Turn right toward destination", "distance": "800 m"},
                ],
                "polyline": None,
            }
        params = {
            "origin": f"{origin_lat},{origin_lng}",
            "destination": f"{dest_lat},{dest_lng}",
            "mode": mode,
            "key": self.api_key,
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(DIRECTIONS_BASE, params=params)
            res.raise_for_status()
            data = res.json()
        routes = data.get("routes") or []
        if not routes:
            return {"summary": "No route found", "distance": "", "duration": "", "steps": [], "polyline": None}
        leg = routes[0]["legs"][0]
        steps = [
            {
                "instruction": s.get("html_instructions", "").replace("<b>", "").replace("</b>", ""),
                "distance": s.get("distance", {}).get("text", ""),
            }
            for s in leg.get("steps", [])
        ]
        return {
            "summary": routes[0].get("summary", ""),
            "distance": leg.get("distance", {}).get("text", ""),
            "duration": leg.get("duration", {}).get("text", ""),
            "steps": steps[:12],
            "polyline": routes[0]["overview_polyline"]["points"],
        }

    def _normalize_place(self, p: dict[str, Any]) -> dict[str, Any]:
        loc = (p.get("geometry") or {}).get("location") or {}
        return {
            "place_id": p.get("place_id", ""),
            "name": p.get("name", ""),
            "address": p.get("formatted_address") or p.get("vicinity", ""),
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "rating": p.get("rating"),
            "types": p.get("types", [])[:3],
            "open_now": (p.get("opening_hours") or {}).get("open_now"),
        }

    def _demo_places(self, query: str) -> list[dict[str, Any]]:
        return [
            {
                "place_id": "demo-1",
                "name": f"{query.title()} — Demo Bistro",
                "address": "14 Market St, London",
                "lat": 51.5074,
                "lng": -0.1278,
                "rating": 4.6,
                "types": ["restaurant", "food"],
                "open_now": True,
            },
            {
                "place_id": "demo-2",
                "name": f"{query.title()} — Riverside Kitchen",
                "address": "88 Thames Walk, London",
                "lat": 51.5090,
                "lng": -0.1200,
                "rating": 4.4,
                "types": ["restaurant"],
                "open_now": True,
            },
        ]

    def _demo_nearby(self, lat: float, lng: float, place_type: str) -> list[dict[str, Any]]:
        label = place_type.replace("_", " ").title()
        return [
            {
                "place_id": f"nearby-{place_type}-1",
                "name": f"Nearby {label}",
                "address": "0.3 km away",
                "lat": lat + 0.003,
                "lng": lng + 0.002,
                "rating": 4.5,
                "types": [place_type],
                "open_now": True,
            },
            {
                "place_id": f"nearby-{place_type}-2",
                "name": f"Local {label} Spot",
                "address": "0.8 km away",
                "lat": lat - 0.004,
                "lng": lng + 0.005,
                "rating": 4.2,
                "types": [place_type],
                "open_now": False,
            },
        ]