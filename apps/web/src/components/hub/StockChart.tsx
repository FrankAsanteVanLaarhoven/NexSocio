"use client";

import type { MarketHistoryPoint } from "@nexus/types";

export function StockChart({
  points,
  positive,
}: {
  points: MarketHistoryPoint[];
  positive: boolean;
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-[#5A5A5A]">
        No chart data
      </div>
    );
  }

  const w = 400;
  const h = 120;
  const pad = 8;
  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p.close - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });

  const color = positive ? "#00C853" : "#FF5252";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={coords.join(" ")}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        fill="url(#chartFill)"
        points={`${pad},${h - pad} ${coords.join(" ")} ${w - pad},${h - pad}`}
      />
    </svg>
  );
}