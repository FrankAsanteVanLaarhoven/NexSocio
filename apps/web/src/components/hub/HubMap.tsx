"use client";

import type { MapEvent } from "@nexus/types";

const CATEGORY_COLORS: Record<string, string> = {
  market: "#00E5FF",
  social: "#7C4DFF",
  nexsocio: "#FFB300",
};

function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

export function HubMap({ events }: { events: MapEvent[] }) {
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]">
      <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-30">
        <ellipse cx="50" cy="25" rx="48" ry="23" fill="none" stroke="#2A2A2A" strokeWidth="0.3" />
        {[20, 35, 50, 65, 80].map((x) => (
          <line key={`v${x}`} x1={x} y1="2" x2={x} y2="48" stroke="#1F1F1F" strokeWidth="0.15" />
        ))}
        {[12, 25, 38].map((y) => (
          <line key={`h${y}`} x1="2" y1={y} x2="98" y2={y} stroke="#1F1F1F" strokeWidth="0.15" />
        ))}
      </svg>
      {events.map((e) => {
        const { x, y } = project(e.lat, e.lng);
        const color = CATEGORY_COLORS[e.category] || "#8A8A8A";
        return (
          <div
            key={e.id}
            className="absolute group"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <div className="pointer-events-none absolute left-1/2 top-4 z-10 hidden w-36 -translate-x-1/2 rounded-md border border-[#2A2A2A] bg-[#111111]/95 px-2 py-1.5 text-center group-hover:block">
              <p className="text-[10px] font-medium text-[#F5F5F5]">{e.title}</p>
              <p className="text-[9px] text-[#5A5A5A]">{e.city} · {e.status}</p>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-2 left-2 flex gap-3 text-[9px] text-[#5A5A5A]">
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E5FF] mr-1" />Market</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7C4DFF] mr-1" />Social</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFB300] mr-1" />NexSocio</span>
      </div>
    </div>
  );
}