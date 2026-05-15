"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GoldCoinProps = {
  size?: number;
  className?: string;
  animate?: boolean;
  label?: string;
  outline?: boolean;
};

export function GoldCoin({ size = 40, className, animate = false, label = "₮", outline = false }: GoldCoinProps) {
  if (outline) {
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-full border-2", className)}
        style={{ width: size, height: size, borderColor: "#D97706", opacity: 0.35 }}
      />
    );
  }

  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? { y: [0, -6, 0] } : undefined}
      transition={animate ? { duration: 3, repeat: Infinity, ease: "easeInOut" as const } : undefined}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`coinFace-${size}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="35%" stopColor="#FCD34D" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <radialGradient id={`coinRing-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="75%" stopColor="#D97706" />
            <stop offset="85%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#92400E" />
          </radialGradient>
          <linearGradient id={`coinShine-${size}`} x1="20%" y1="20%" x2="70%" y2="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill={`url(#coinRing-${size})`} />
        <circle cx="20" cy="20" r="16" fill={`url(#coinFace-${size})`} />
        <circle cx="20" cy="20" r="13" fill="none" stroke="#D97706" strokeWidth="0.8" strokeOpacity="0.5" />
        <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="900" fill="#78350F" fontFamily="sans-serif">{label}</text>
        <ellipse cx="14" cy="13" rx="5" ry="3.5" fill={`url(#coinShine-${size})`} />
      </svg>
    </motion.div>
  );
}
