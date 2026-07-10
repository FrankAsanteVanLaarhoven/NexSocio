"use client";

import { CREATOR_FILTERS } from "@/lib/creator-filters";

export function FilterCarousel({
  value,
  onChange,
  allowedIds,
}: {
  value: string;
  onChange: (id: string) => void;
  allowedIds: Set<string>;
}) {
  const filters = CREATOR_FILTERS.filter((f) => allowedIds.has(f.id));

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => {
          const active = value === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2 transition-colors ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-[#2A2A2A] hover:border-[#3A3A3A]"
              }`}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#0A1628] text-lg"
                style={{ filter: f.css === "none" ? undefined : f.css }}
              >
                {f.id === "none" ? "○" : "✦"}
              </span>
              <span className={`text-[9px] font-medium uppercase tracking-wide ${active ? "text-accent" : "text-[#8A8A8A]"}`}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}