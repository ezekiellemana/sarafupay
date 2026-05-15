"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MoneyBagProps = {
  size?: number;
  className?: string;
  animate?: boolean;
};

export function MoneyBag({ size = 80, className, animate = true }: MoneyBagProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? { scale: [1, 1.04, 1], y: [0, -4, 0] } : undefined}
      transition={animate ? { duration: 5, repeat: Infinity, ease: "easeInOut" as const } : undefined}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bagBody" cx="38%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="60%" stopColor="#0b1f3a" />
            <stop offset="100%" stopColor="#071428" />
          </radialGradient>
          <radialGradient id="bagHighlight" cx="35%" cy="28%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coinFaceB" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="45%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Bag neck */}
        <ellipse cx="40" cy="20" rx="8" ry="4" fill="url(#tieGrad)" />
        <path d="M33 18 C30 14 28 10 32 8 C36 6 44 6 48 8 C52 10 50 14 47 18" stroke="url(#tieGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Bag body */}
        <ellipse cx="40" cy="51" rx="28" ry="26" fill="url(#bagBody)" />
        <ellipse cx="40" cy="51" rx="28" ry="26" fill="url(#bagHighlight)" />

        {/* Crease lines */}
        <path d="M18 48 Q40 38 62 48" stroke="white" strokeWidth="0.6" strokeOpacity="0.08" fill="none" />
        <path d="M16 55 Q40 45 64 55" stroke="white" strokeWidth="0.6" strokeOpacity="0.06" fill="none" />

        {/* $ symbol */}
        <text x="40" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill="#F59E0B" fontFamily="sans-serif" opacity="0.9">$</text>

        {/* Small coins */}
        <g transform="translate(6, 22)">
          <circle cx="7" cy="7" r="6.5" fill="url(#coinFaceB)" />
          <circle cx="7" cy="7" r="5" fill="none" stroke="#D97706" strokeWidth="0.7" strokeOpacity="0.5" />
          <text x="7" y="10" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">₮</text>
        </g>
        <g transform="translate(57, 16)">
          <circle cx="7" cy="7" r="6" fill="url(#coinFaceB)" />
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="#D97706" strokeWidth="0.7" strokeOpacity="0.5" />
          <text x="7" y="10" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">₮</text>
        </g>
        <g transform="translate(26, 70)">
          <circle cx="7" cy="5" r="5" fill="url(#coinFaceB)" />
          <text x="7" y="8" textAnchor="middle" fontSize="4" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">₮</text>
        </g>
      </svg>
    </motion.div>
  );
}
