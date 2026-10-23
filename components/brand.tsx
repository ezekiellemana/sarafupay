import { env } from "@/lib/env";
import Link from "next/link";
import { CoinMark } from "./coin-mark";

export { CoinMark };

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 group" aria-label="SarafuPay home">
      <CoinMark size={34} />
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? "text-paper" : "text-ink"}`}>
        <span style={{ color: light ? undefined : "#035034" }}>Sarafu</span><span style={{ color: "#C4A237" }}>Pay</span>
      </span>
    </Link>
  );
}

/** Shown only while payments run in test mode (PAYPAL_ENV is not "live"). */
export function SandboxBadge() {
  if (env.paypalEnv() === "live") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1 text-xs font-medium text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-marigold" /> Test mode · no real money
    </span>
  );
}

export function Progress({ percent }: { percent: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-paper-2 ring-1 ring-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(2, percent)}%`,
          background: "repeating-linear-gradient(45deg, #0e3b2c 0 10px, #15543f 10px 20px)",
        }}
      />
    </div>
  );
}
