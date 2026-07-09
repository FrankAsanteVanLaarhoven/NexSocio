"use client";

import { cn } from "@nexus/ui";

interface PinPadProps {
  value: string;
  onChange: (pin: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function PinPad({ value, onChange, maxLength = 6, disabled }: PinPadProps) {
  function press(digit: string) {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  }

  function backspace() {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 w-3 rounded-full border transition-colors",
              i < value.length
                ? "border-[#00E5FF] bg-[#00E5FF]"
                : "border-[#3A3A3A] bg-transparent"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (key === "clear") onChange("");
              else if (key === "back") backspace();
              else press(key);
            }}
            className={cn(
              "h-12 rounded-lg border border-[#2A2A2A] bg-[#111111] text-sm font-medium text-[#F5F5F5]",
              "hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              key === "clear" && "text-xs text-[#8A8A8A]",
              key === "back" && "text-xs text-[#8A8A8A]"
            )}
          >
            {key === "back" ? "⌫" : key === "clear" ? "Clear" : key}
          </button>
        ))}
      </div>
    </div>
  );
}