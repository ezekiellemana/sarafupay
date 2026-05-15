"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CoinStackProps = {
  size?: number;
  className?: string;
  animate?: boolean;
};

export function CoinStack({ size = 80, className, animate = true }: CoinStackProps) {
  const w = size;
  const h = size * 1.2;

  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? { y: [0, -10, 0], rotate: [0, 1.5, 0] } : undefined}
      transition={animate ? { duration: 4, repeat: Infinity, ease: "easeInOut" as const } : undefined}
    >
      <svg width={w} height={h} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coinTopGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="coinSideGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="coinTopGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="coinSideGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Bottom coin */}
        <ellipse cx="40" cy="82" rx="36" ry="10" fill="url(#coinSideGrad2)" />
        <rect x="4" y="72" width="72" height="10" fill="url(#coinSideGrad2)" />
        <ellipse cx="40" cy="72" rx="36" ry="10" fill="url(#coinTopGrad2)" />
        <ellipse cx="40" cy="72" rx="24" ry="6.5" fill="url(#coinTopGrad2)" opacity="0.6" />
        <ellipse cx="33" cy="69" rx="10" ry="3" fill="url(#shineGrad)" />

        {/* Middle coin */}
        <ellipse cx="40" cy="60" rx="36" ry="10" fill="url(#coinSideGrad1)" />
        <rect x="4" y="50" width="72" height="10" fill="url(#coinSideGrad1)" />
        <ellipse cx="40" cy="50" rx="36" ry="10" fill="url(#coinTopGrad1)" />
        <ellipse cx="40" cy="50" rx="24" ry="6.5" fill="url(#coinTopGrad1)" opacity="0.6" />
        <ellipse cx="33" cy="47" rx="10" ry="3" fill="url(#shineGrad)" />

        {/* Top coin */}
        <ellipse cx="40" cy="38" rx="36" ry="10" fill="url(#coinSideGrad1)" />
        <rect x="4" y="28" width="72" height="10" fill="url(#coinSideGrad1)" />
        <ellipse cx="40" cy="28" rx="36" ry="10" fill="url(#coinTopGrad1)" />
        <ellipse cx="40" cy="28" rx="24" ry="6.5" fill="url(#coinTopGrad1)" opacity="0.5" />
        <text x="40" y="31" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">TZS</text>
        <ellipse cx="30" cy="25" rx="9" ry="2.8" fill="url(#shineGrad)" />
      </svg>
    </motion.div>
  );
}
