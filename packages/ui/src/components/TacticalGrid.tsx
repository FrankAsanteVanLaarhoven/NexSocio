"use client";

export function TacticalGrid() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        backgroundImage: `
          linear-gradient(var(--color-accent-grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--color-accent-grid) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
      }}
    />
  );
}