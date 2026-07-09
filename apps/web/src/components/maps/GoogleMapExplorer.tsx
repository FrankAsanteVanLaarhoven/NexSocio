"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DirectionsResult, PlaceResult } from "@nexus/types";
import { getDirections, searchPlaces, nearbyPlaces } from "@/lib/api";

const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 };
const MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type MapMode = "roadmap" | "satellite";

function DirectionsLayer({
  origin,
  destination,
  onReady,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onReady: (d: DirectionsResult | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");

  useEffect(() => {
    if (!map || !routesLib) return;
    const service = new routesLib.DirectionsService();
    const renderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#00E5FF", strokeWeight: 5 },
    });
    service.route(
      {
        origin,
        destination,
        travelMode: routesLib.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          renderer.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          onReady({
            summary: result.routes[0]?.summary || "",
            distance: leg?.distance?.text || "",
            duration: leg?.duration?.text || "",
            steps: (leg?.steps || []).map((s) => ({
              instruction: s.instructions?.replace(/<[^>]+>/g, "") || "",
              distance: s.distance?.text || "",
            })),
            polyline: result.routes[0]?.overview_polyline,
          });
        } else {
          getDirections(origin.lat, origin.lng, destination.lat, destination.lng)
            .then(onReady)
            .catch(() => onReady(null));
        }
      }
    );
    return () => renderer.setMap(null);
  }, [map, routesLib, origin, destination, onReady]);

  return null;
}

function MapInner({
  center,
  mapMode,
  markers,
  destination,
  userLocation,
  onDirections,
}: {
  center: { lat: number; lng: number };
  mapMode: MapMode;
  markers: PlaceResult[];
  destination: { lat: number; lng: number; name: string } | null;
  userLocation: { lat: number; lng: number } | null;
  onDirections: (d: DirectionsResult | null) => void;
}) {
  return (
    <Map
      defaultCenter={center}
      defaultZoom={13}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
      mapTypeId={mapMode}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="h-full w-full rounded-xl"
    >
      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <Pin background="#7C4DFF" borderColor="#fff" glyphColor="#fff" />
        </AdvancedMarker>
      )}
      {markers.map((m) =>
        m.lat != null && m.lng != null ? (
          <AdvancedMarker key={`${m.place_id}-${m.name}`} position={{ lat: m.lat, lng: m.lng }}>
            <Pin
              background={m.source === "nexsocio_post" ? "#FFB300" : "#00E5FF"}
              borderColor="#0A0A0A"
              glyphColor="#0A0A0A"
            />
          </AdvancedMarker>
        ) : null
      )}
      {destination && userLocation && (
        <DirectionsLayer
          origin={userLocation}
          destination={destination}
          onReady={onDirections}
        />
      )}
    </Map>
  );
}

export function GoogleMapExplorer({
  initialLat,
  initialLng,
  initialName,
  autoNavigate,
  promotedPlaces = [],
}: {
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  autoNavigate?: boolean;
  promotedPlaces?: PlaceResult[];
}) {
  const [mapMode, setMapMode] = useState<MapMode>("roadmap");
  const [query, setQuery] = useState("");
  const [nearbyType, setNearbyType] = useState("restaurant");
  const [markers, setMarkers] = useState<PlaceResult[]>(promotedPlaces);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const center = useMemo(() => {
    if (initialLat != null && initialLng != null) return { lat: initialLat, lng: initialLng };
    if (userLocation) return userLocation;
    return DEFAULT_CENTER;
  }, [initialLat, initialLng, userLocation]);

  const destination = useMemo(() => {
    if (selected?.lat != null && selected?.lng != null) {
      return { lat: selected.lat, lng: selected.lng, name: selected.name };
    }
    if (initialLat != null && initialLng != null) {
      return { lat: initialLat, lng: initialLng, name: initialName || "Destination" };
    }
    return null;
  }, [selected, initialLat, initialLng, initialName]);

  useEffect(() => {
    if (promotedPlaces.length) {
      setMarkers((prev) => {
        const ids = new Set(prev.map((p) => p.place_id));
        return [...prev, ...promotedPlaces.filter((p) => !ids.has(p.place_id))];
      });
    }
  }, [promotedPlaces]);

  useEffect(() => {
    if (initialLat != null && initialLng != null && initialName) {
      setSelected({
        place_id: "dest",
        name: initialName,
        address: "",
        lat: initialLat,
        lng: initialLng,
      });
    }
  }, [initialLat, initialLng, initialName]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(center)
    );
  }, [center.lat, center.lng]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchPlaces(
        query,
        userLocation?.lat,
        userLocation?.lng
      );
      setMarkers((prev) => {
        const merged = [...results];
        for (const p of prev) {
          if (p.source === "nexsocio_post" && !merged.find((m) => m.place_id === p.place_id)) {
            merged.push(p);
          }
        }
        return merged;
      });
      if (results[0]) setSelected(results[0]);
    } finally {
      setLoading(false);
    }
  }, [query, userLocation]);

  const loadNearby = useCallback(async (type: string) => {
    const loc = userLocation || center;
    setLoading(true);
    try {
      const results = await nearbyPlaces(loc.lat, loc.lng, type);
      setMarkers((prev) => {
        const posts = prev.filter((p) => p.source === "nexsocio_post");
        return [...posts, ...results];
      });
      setNearbyType(type);
    } finally {
      setLoading(false);
    }
  }, [userLocation, center]);

  if (!MAP_KEY) {
    return (
      <div className="rounded-xl border border-[#FFB300]/30 bg-[#FFB300]/5 p-6 text-center space-y-2">
        <p className="text-sm text-[#F5F5F5]">Google Maps API key required</p>
        <p className="text-xs text-[#8A8A8A]">
          Set <code className="text-[#00E5FF]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> and{" "}
          <code className="text-[#00E5FF]">GOOGLE_MAPS_API_KEY</code> on the hub service for
          satellite view, navigation, restaurants, and landmarks.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAP_KEY}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search restaurants, landmarks, events…"
            className="flex-1 min-w-[200px] rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 text-xs rounded-md border border-[#00E5FF]/40 text-[#00E5FF]"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setMapMode((m) => (m === "satellite" ? "roadmap" : "satellite"))}
            className="px-4 py-2 text-xs rounded-md border border-[#2A2A2A] text-[#8A8A8A]"
          >
            {mapMode === "satellite" ? "Map" : "Satellite"}
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {["restaurant", "tourist_attraction", "cafe", "bar", "museum"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => loadNearby(t)}
              className={`shrink-0 px-3 py-1 text-[10px] rounded-full border ${
                nearbyType === t ? "border-[#00E5FF] text-[#00E5FF]" : "border-[#2A2A2A] text-[#5A5A5A]"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-xl border border-[#1F1F1F]">
          <MapInner
            center={center}
            mapMode={mapMode}
            markers={markers}
            destination={autoNavigate ? destination : selected ? destination : null}
            userLocation={userLocation}
            onDirections={setDirections}
          />
        </div>
        {selected && (
          <div className="rounded-lg border border-[#1F1F1F] p-4 space-y-2">
            <p className="text-sm font-medium text-[#F5F5F5]">{selected.name}</p>
            <p className="text-xs text-[#8A8A8A]">{selected.address}</p>
            {selected.promoted_by && (
              <p className="text-[10px] text-[#FFB300]">Promoted by {selected.promoted_by}</p>
            )}
            {selected.rating != null && (
              <p className="text-xs text-[#00E5FF]">★ {selected.rating}</p>
            )}
            <button
              type="button"
              onClick={() => setSelected({ ...selected })}
              className="text-xs text-[#00E5FF] hover:underline"
            >
              Get directions
            </button>
            {directions && (
              <div className="mt-2 pt-2 border-t border-[#1F1F1F] space-y-1">
                <p className="text-xs text-[#00C853]">
                  {directions.duration} · {directions.distance}
                </p>
                {directions.steps.slice(0, 5).map((s, i) => (
                  <p key={i} className="text-[10px] text-[#8A8A8A]">
                    {i + 1}. {s.instruction} ({s.distance})
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {markers.map((m) => (
            <button
              key={`${m.place_id}-row`}
              type="button"
              onClick={() => setSelected(m)}
              className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-[#1A1A1A] flex justify-between"
            >
              <span className="text-[#F5F5F5]">{m.name}</span>
              <span className="text-[#5A5A5A]">{m.source === "nexsocio_post" ? "★ promoted" : ""}</span>
            </button>
          ))}
        </div>
      </div>
    </APIProvider>
  );
}