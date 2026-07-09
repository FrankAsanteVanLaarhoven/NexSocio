"use client";

import { motion } from "framer-motion";
import { cn } from "../utils";

interface PulseBadgeProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export function PulseBadge({ children, className, active = true }: PulseBadgeProps) {
  return (
    <motion.span
      animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={active ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
      className={cn(className)}
    >
      {children}
    </motion.span>
  );
}