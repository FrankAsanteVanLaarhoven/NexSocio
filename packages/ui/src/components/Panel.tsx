"use client";

import { cn } from "../utils";

interface PanelProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export function Panel({ open, children, className, title, subtitle, onClose }: PanelProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "nexus-panel rounded-lg border border-default bg-surface",
        "shadow-[0_8px_32px_rgba(0,0,0,0.15)]",
        className
      )}
    >
      {(title || onClose) && (
        <div className="flex items-start justify-between border-b border-subtle px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-wide text-primary">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-dim hover:text-primary transition-colors text-lg leading-none"
              aria-label="Close panel"
            >
              ×
            </button>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}