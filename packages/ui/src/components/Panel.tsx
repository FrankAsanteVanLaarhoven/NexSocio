"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "rounded-lg border border-[#2A2A2A] bg-[#111111]/95 backdrop-blur-md",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            className
          )}
        >
          {(title || onClose) && (
            <div className="flex items-start justify-between border-b border-[#1F1F1F] px-5 py-4">
              <div>
                {title && (
                  <h3 className="text-sm font-semibold tracking-wide text-[#F5F5F5]">{title}</h3>
                )}
                {subtitle && <p className="mt-0.5 text-xs text-[#8A8A8A]">{subtitle}</p>}
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-[#5A5A5A] hover:text-[#F5F5F5] transition-colors text-lg leading-none"
                  aria-label="Close panel"
                >
                  ×
                </button>
              )}
            </div>
          )}
          <div className="p-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}