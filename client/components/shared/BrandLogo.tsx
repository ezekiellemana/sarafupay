import { cn } from "@/lib/utils";

export type BrandLogoVariant = "light" | "dark" | "icon";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  height?: number;
  className?: string;
}

// ── Brand tokens ────────────────────────────────────────────────────────────
const GREEN_DARK = "#035034";
const GOLD = "#C4A237";
const GOLD_LIGHT = "#F2D37A";

// ── S mark — circle with gold ring and gold S letterform ─────────────────────
function SMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden="true"
    >
      {/* Dark green base */}
      <circle cx="30" cy="30" r="29" fill={GREEN_DARK} />
      {/* Gold outer ring */}
      <circle cx="30" cy="30" r="29" fill="none" stroke={GOLD} strokeWidth="3" />
      {/* Subtle inner highlight ring */}
      <circle cx="30" cy="30" r="24.5" fill="none" stroke={GOLD_LIGHT} strokeWidth="0.75" opacity="0.45" />
      {/* S lettermark */}
      <text
        x="30"
        y="42"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill={GOLD}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        S
      </text>
    </svg>
  );
}

// ── Full logo (mark + wordmark) ───────────────────────────────────────────────
export function BrandLogo({ variant = "light", height = 36, className }: BrandLogoProps) {
  const markSize = Math.round(height * 0.88);
  const wordSize = Math.round(height * 0.37);
  const tagSize = Math.max(8, Math.round(height * 0.20));
  const isDark = variant === "dark";

  if (variant === "icon") {
    return (
      <span className={cn("inline-block", className)}>
        <SMark size={markSize} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <SMark size={markSize} />
      <span className="flex flex-col leading-none" style={{ gap: "0.18em" }}>
        <span
          style={{
            fontSize: wordSize,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: isDark ? "#ffffff" : GREEN_DARK,
          }}
        >
          Sarafu
          <span style={{ color: GOLD }}>Pay</span>
        </span>
        {height >= 32 && (
          <span
            style={{
              fontSize: tagSize,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase" as const,
              lineHeight: 1,
              color: isDark ? `${GOLD_LIGHT}bb` : `${GOLD}cc`,
            }}
          >
            Powering Payments
          </span>
        )}
      </span>
    </span>
  );
}
