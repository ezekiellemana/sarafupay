/* eslint-disable @next/next/no-img-element -- tiny local brand files; next/image adds nothing here. */

/**
 * Brand marks, each the owner's own artwork from /public/brand (taken from their official sites or
 * brand packs, unmodified). ratio = width / height. `tile` is a background for marks made for dark
 * backgrounds (NMB's white logo).
 */
type MarkFile = { src: string; srcSet?: string; ratio: number; tile?: string; boost?: number };

const MARKS = {
  Snippe: { src: "/brand/snippe-mark.svg", ratio: 1 },
  PayPal: { src: "/brand/paypal-mark.svg", ratio: 1 },
  Mastercard: {
    src: "/brand/mastercard-symbol-3x.png",
    srcSet: "/brand/mastercard-symbol-1x.png 1x, /brand/mastercard-symbol-2x.png 2x, /brand/mastercard-symbol-3x.png 3x",
    ratio: 46 / 33,
  },
  Visa: { src: "/brand/visa.svg", ratio: 161 / 54 },
  "M-Pesa": { src: "/brand/mpesa.png", ratio: 320 / 84 },
  "Airtel Money": { src: "/brand/airtel-money.png", ratio: 330 / 442, boost: 1.5 },
  Mixx: { src: "/brand/mixx.svg", ratio: 201 / 81 },
  CRDB: { src: "/brand/crdb.svg", ratio: 340.79 / 129.79 },
  NMB: { src: "/brand/nmb-white.png", ratio: 337 / 243, tile: "#0b3a6e" },
  NBC: { src: "/brand/nbc.svg", ratio: 50.1 / 44, boost: 1.25 },
  Absa: { src: "/brand/absa.png", ratio: 1, boost: 1.2 },
  Exim: { src: "/brand/exim.png", ratio: 536 / 118 },
} satisfies Record<string, MarkFile>;

export type BrandName = keyof typeof MARKS;
/** The two payment providers SarafuPay runs on. */
export type ProviderName = "Snippe" | "PayPal";

export const PAY_WITH: BrandName[] = ["M-Pesa", "Airtel Money", "Mixx", "Visa", "Mastercard", "PayPal"];
export const PAYOUT_TO: BrandName[] = ["CRDB", "NMB", "NBC", "Absa", "Exim", "M-Pesa", "Airtel Money", "Mixx"];
export const MOBILE_MONEY: BrandName[] = ["M-Pesa", "Airtel Money", "Mixx"];
export const CARDS: BrandName[] = ["Visa", "Mastercard", "PayPal"];

/** A provider's mark, optionally followed by its name, sized to sit inside a line of text. */
export function Provider({
  name,
  size = "1.25em",
  label = true,
  className = "",
}: {
  name: BrandName;
  size?: string;
  label?: boolean;
  className?: string;
}) {
  const m: MarkFile = MARKS[name];
  return (
    <span className={`inline-flex items-center gap-[0.3em] whitespace-nowrap align-[-0.25em] ${className}`}>
      <img
        src={m.src}
        srcSet={m.srcSet}
        alt={label ? "" : name}
        width={Math.round(16 * m.ratio)}
        height={16}
        style={{ height: size, width: "auto" }}
        className="shrink-0"
      />
      {label ? <span>{name}</span> : null}
    </span>
  );
}

/** Just the mark, at a fixed height, for logo rows. */
export function Mark({ name, height = 28, className = "" }: { name: BrandName; height?: number; className?: string }) {
  const m: MarkFile = MARKS[name];
  const img = (
    <img
      src={m.src}
      srcSet={m.srcSet}
      alt={name}
      width={Math.round(height * m.ratio)}
      height={height}
      loading="lazy"
      className={`shrink-0 ${m.tile ? "" : className}`}
      style={{ height, width: "auto", "--b": m.boost ?? 1 } as React.CSSProperties}
    />
  );
  if (!m.tile) return img;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-[0.35em] py-[0.15em] ${className}`} style={{ background: m.tile }}>
      {img}
    </span>
  );
}

/** A white tile holding one mark: the unit used in logo belts. */
export function MarkTile({ name, height = 40, className = "" }: { name: BrandName; height?: number; className?: string }) {
  return (
    <span className={`mark-tile ${className}`}>
      <Mark name={name} height={height} />
    </span>
  );
}

export const providerFor = (provider: string | null | undefined): ProviderName => (provider === "snippe" ? "Snippe" : "PayPal");
