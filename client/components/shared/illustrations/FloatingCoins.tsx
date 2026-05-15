"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FloatingCoinsProps = {
  count?: number;
  className?: string;
  opacity?: number;
};

const COIN_CONFIGS = [
  { x: "8%",  y: "15%", size: 24, delay: 0,    dur: 4.2, label: "₮" },
  { x: "82%", y: "8%",  size: 20, delay: 0.8,  dur: 3.8, label: "$" },
  { x: "15%", y: "72%", size: 18, delay: 1.4,  dur: 5.0, label: "₮" },
  { x: "75%", y: "65%", size: 22, delay: 0.4,  dur: 4.6, label: "$" },
  { x: "50%", y: "85%", size: 16, delay: 2.0,  dur: 3.5, label: "₮" },
  { x: "90%", y: "40%", size: 20, delay: 1.0,  dur: 4.8, label: "$" },
  { x: "30%", y: "5%",  size: 18, delay: 0.6,  dur: 4.0, label: "₮" },
  { x: "60%", y: "25%", size: 14, delay: 1.8,  dur: 5.2, label: "$" },
];

export function FloatingCoins({ count = 5, className, opacity = 0.35 }: FloatingCoinsProps) {
  const coins = COIN_CONFIGS.slice(0, count);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {coins.map((coin, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: coin.x, top: coin.y, opacity }}
          animate={{ y: [0, -(coin.size * 0.5), 0], rotate: [0, 8, -4, 0] }}
          transition={{ duration: coin.dur, delay: coin.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width={coin.size} height={coin.size} viewBox="0 0 40 40" fill="none">
            <defs>
              <radialGradient id={`fc-${i}`} cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="45%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#D97706" />
              </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="19" fill="#B45309" opacity="0.6" />
            <circle cx="20" cy="20" r="16" fill={`url(#fc-${i})`} />
            <circle cx="20" cy="20" r="13" fill="none" stroke="#D97706" strokeWidth="1" strokeOpacity="0.5" />
            <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="900" fill="#78350F" fontFamily="sans-serif">{coin.label}</text>
            <ellipse cx="14" cy="13" rx="5" ry="3.5" fill="white" fillOpacity="0.4" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
