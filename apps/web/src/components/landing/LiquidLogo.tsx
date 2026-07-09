"use client";

import { motion, useReducedMotion } from "framer-motion";

const DRIPS = [
  { cx: 42, cy: 168, r: 9, delay: 0.1 },
  { cx: 28, cy: 132, r: 7, delay: 0.25 },
  { cx: 18, cy: 98, r: 6, delay: 0.4 },
  { cx: 118, cy: 178, r: 8, delay: 0.55 },
  { cx: 132, cy: 42, r: 10, delay: 0.7 },
  { cx: 148, cy: 28, r: 6, delay: 0.85 },
] as const;

const NODES = [
  { cx: 14, cy: 168, link: { x: 42, y: 168 } },
  { cx: 10, cy: 132, link: { x: 28, y: 132 } },
  { cx: 8, cy: 98, link: { x: 18, y: 98 } },
] as const;

export function LiquidLogo({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 160 200"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <filter id="nex-liquid-goo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <linearGradient id="nex-liquid-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#e8f4ff" />
            <stop offset="100%" stopColor="#b8d9ff" />
          </linearGradient>
        </defs>

        {/* Network nodes */}
        <g opacity={0.85}>
          {NODES.map((node, i) => (
            <g key={i}>
              <motion.line
                x1={node.cx}
                y1={node.cy}
                x2={node.link.x}
                y2={node.link.y}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1.2 + i * 0.12 }}
              />
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={4}
                fill="#ffffff"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 1.35 + i * 0.12 }}
              />
            </g>
          ))}
        </g>

        {/* Liquid body — goo-filtered blobs form the N */}
        <g filter="url(#nex-liquid-goo)">
          {/* Left stem */}
          {/* Base pool rises first */}
          <motion.ellipse
            cx={80}
            cy={182}
            rx={46}
            ry={14}
            fill="url(#nex-liquid-shine)"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.rect
            x={34}
            y={28}
            width={22}
            height={148}
            rx={11}
            fill="url(#nex-liquid-shine)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
            transition={{ duration: reduceMotion ? 0 : 1.1, delay: reduceMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.rect
            x={52}
            y={52}
            width={20}
            height={118}
            rx={10}
            fill="url(#nex-liquid-shine)"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1, rotate: -38 }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
            transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.rect
            x={104}
            y={28}
            width={22}
            height={148}
            rx={11}
            fill="url(#nex-liquid-shine)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
            transition={{ duration: reduceMotion ? 0 : 1.1, delay: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Splash crown on right stem */}
          <motion.ellipse
            cx={128}
            cy={34}
            rx={18}
            ry={14}
            fill="url(#nex-liquid-shine)"
            initial={{ scale: 0, x: 8, y: -10 }}
            animate={{ scale: 1, x: 0, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.95, type: "spring", stiffness: 180 }}
          />

          {/* Side drips that merge into the N */}
          {DRIPS.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill="url(#nex-liquid-shine)"
              initial={{ cy: 210, scale: 0.4, opacity: 0 }}
              animate={{ cy: d.cy, scale: 1, opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.9,
                delay: reduceMotion ? 0 : d.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {/* Falling drips loop */}
          {!reduceMotion &&
            [48, 115].map((x, i) => (
              <motion.circle
                key={`fall-${i}`}
                cx={x}
                cy={176}
                r={5}
                fill="#ffffff"
                animate={{ cy: [176, 198, 176], scale: [1, 0.6, 1], opacity: [0.9, 0, 0.9] }}
                transition={{
                  duration: 2.4,
                  delay: 1.8 + i * 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
        </g>

        {/* Pool shimmer at base */}
        <motion.ellipse
          cx={80}
          cy={188}
          rx={52}
          ry={8}
          fill="rgba(0, 122, 255, 0.25)"
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: [0.4, 0.7, 0.4], scaleX: [0.85, 1.05, 0.85] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </svg>
    </div>
  );
}