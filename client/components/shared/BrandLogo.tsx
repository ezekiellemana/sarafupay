"use client";

import { useState } from "react";
import Image from "next/image";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "light" | "dark" | "icon";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  height?: number;
  className?: string;
}

const SRCS: Record<BrandLogoVariant, string> = {
  light: "/brand/sarafupay-horizontal-logo.png",
  dark: "/brand/sarafupay-logo-white.png",
  icon: "/brand/sarafupay-icon.png",
};

function Fallback({ variant, className }: { variant: BrandLogoVariant; className?: string }) {
  const isDark = variant === "dark";
  if (variant === "icon") {
    return (
      <span
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-2xl coin-glow",
          isDark ? "bg-white/10" : "bg-[#0B1F3A]",
          className,
        )}
      >
        <WalletCards className={cn("size-5", isDark ? "text-amber-400" : "text-white")} />
      </span>
    );
  }
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-xl coin-glow",
          isDark ? "bg-white/10" : "bg-[#0B1F3A]",
        )}
      >
        <WalletCards className={cn("size-5", isDark ? "text-amber-400" : "text-white")} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-[#0B1F3A]")}>
          SarafuPay
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold tracking-wide",
            isDark ? "text-amber-400" : "sarafu-gradient-text-gold",
          )}
        >
          Lipa kwa urahisi
        </span>
      </div>
    </span>
  );
}

export function BrandLogo({ variant = "light", height = 36, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Fallback variant={variant} className={className} />;

  return (
    <Image
      src={SRCS[variant]}
      alt="SarafuPay"
      width={300}
      height={height}
      style={{ height: `${height}px`, width: "auto", objectFit: "contain" }}
      className={className}
      onError={() => setFailed(true)}
      priority
    />
  );
}
