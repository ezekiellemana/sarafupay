"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type WalletIllustrationProps = {
  size?: number;
  className?: string;
  animate?: boolean;
};

export function WalletIllustration({ size = 80, className, animate = true }: WalletIllustrationProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? { y: [0, -6, 0] } : undefined}
      transition={animate ? { duration: 5, repeat: Infinity, ease: "easeInOut" as const } : undefined}
    >
      <svg width={size} height={size} viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="walletBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0b1f3a" />
          </linearGradient>
          <linearGradient id="walletCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <radialGradient id="coinFaceW" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
        </defs>

        {/* Wallet body */}
        <rect x="2" y="14" width="62" height="42" rx="6" fill="url(#walletBody)" />
        <rect x="2" y="14" width="8" height="42" rx="4" fill="#071428" />

        {/* Card inside */}
        <rect x="12" y="20" width="44" height="26" rx="4" fill="url(#walletCard)" opacity="0.85" />
        <rect x="12" y="20" width="44" height="10" rx="4" fill="#B45309" opacity="0.4" />
        <rect x="16" y="28" width="10" height="8" rx="2" fill="#D97706" />
        <rect x="17" y="29" width="4" height="3" rx="0.5" fill="#FEF3C7" opacity="0.7" />
        <circle cx="32" cy="36" r="1.5" fill="#78350F" opacity="0.5" />
        <circle cx="37" cy="36" r="1.5" fill="#78350F" opacity="0.5" />
        <circle cx="42" cy="36" r="1.5" fill="#78350F" opacity="0.5" />
        <circle cx="47" cy="36" r="1.5" fill="#78350F" opacity="0.5" />

        {/* Coins spilling out */}
        <g transform="translate(56, 10)">
          <circle cx="10" cy="10" r="9.5" fill="#B45309" opacity="0.5" />
          <circle cx="10" cy="10" r="8" fill="url(#coinFaceW)" />
          <text x="10" y="14" textAnchor="middle" fontSize="7" fontWeight="900" fill="#78350F" fontFamily="sans-serif">₮</text>
          <ellipse cx="7" cy="7" rx="3" ry="2" fill="white" fillOpacity="0.4" />
        </g>
        <g transform="translate(62, 24)">
          <circle cx="8" cy="8" r="7.5" fill="#B45309" opacity="0.4" />
          <circle cx="8" cy="8" r="6.5" fill="url(#coinFaceW)" />
          <text x="8" y="12" textAnchor="middle" fontSize="6" fontWeight="900" fill="#78350F" fontFamily="sans-serif">₮</text>
        </g>

        {/* Clasp */}
        <rect x="60" y="28" width="16" height="16" rx="8" fill="#132f55" />
        <circle cx="68" cy="36" r="4" fill="url(#walletCard)" />
        <circle cx="68" cy="36" r="2" fill="#B45309" />

        <ellipse cx="30" cy="22" rx="14" ry="4" fill="white" fillOpacity="0.06" />
      </svg>
    </motion.div>
  );
}
