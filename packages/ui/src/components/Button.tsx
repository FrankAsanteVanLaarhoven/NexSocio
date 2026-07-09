"use client";

import { cn } from "../utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:brightness-110 border border-accent shadow-[0_0_20px_var(--color-accent-glow)]",
  secondary:
    "bg-surface-elevated text-primary hover:brightness-105 border border-default",
  ghost: "bg-transparent text-muted hover:text-primary hover:bg-surface-elevated",
  danger: "bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-all active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}