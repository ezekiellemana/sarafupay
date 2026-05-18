"use client";

import { useState } from "react";
import Image from "next/image";
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

function Fallback({ variant, height = 36, className }: { variant: BrandLogoVariant; height?: number; className?: string }) {
  const isDark = variant === "dark";
  const markSize = Math.round(height * 0.78);
  const fontSize = Math.round(markSize * 0.55);

  if (variant === "icon") {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-xl",
          isDark ? "bg-white/10 ring-1 ring-white/15" : "bg-[#071a0e]",
          className,
        )}
        style={{ width: markSize, height: markSize }}
      >
        <span className="font-black leading-none text-emerald-400" style={{ fontSize }}>S</span>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-400" />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-xl",
          isDark ? "bg-white/10 ring-1 ring-white/15" : "bg-[#071a0e]",
        )}
        style={{ width: markSize, height: markSize }}
      >
        <span className="font-black leading-none text-emerald-400" style={{ fontSize }}>S</span>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-400" />
      </span>
      <span className="flex flex-col leading-none gap-0.5">
        <span
          className={cn("font-bold tracking-tight", isDark ? "text-white" : "text-[#0B1F3A]")}
          style={{ fontSize: Math.round(height * 0.34) }}
        >
          SarafuPay
        </span>
        <span
          className={cn("font-semibold tracking-wide", isDark ? "text-amber-400/80" : "text-amber-600")}
          style={{ fontSize: Math.round(height * 0.22) }}
        >
          Lipa kwa urahisi
        </span>
      </span>
    </span>
  );
}

export function BrandLogo({ variant = "light", height = 36, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Fallback variant={variant} height={height} className={className} />;

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
