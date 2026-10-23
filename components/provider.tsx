/* eslint-disable @next/next/no-img-element -- tiny local brand files; next/image adds nothing here. */

export type ProviderName = "Snippe" | "PayPal" | "Mastercard";

type Mark = { src: string; srcSet?: string; ratio: number };

/** Each provider's own artwork, unmodified, from /public/brand. ratio = width / height. */
const MARKS: Record<ProviderName, Mark> = {
  Snippe: { src: "/brand/snippe-mark.svg", ratio: 1 },
  PayPal: { src: "/brand/paypal-mark.svg", ratio: 1 },
  Mastercard: {
    src: "/brand/mastercard-symbol-3x.png",
    srcSet: "/brand/mastercard-symbol-1x.png 1x, /brand/mastercard-symbol-2x.png 2x, /brand/mastercard-symbol-3x.png 3x",
    ratio: 46 / 33,
  },
};

/** A provider's mark, optionally followed by its name, sized to sit inside a line of text. */
export function Provider({
  name,
  size = "1.05em",
  label = true,
  className = "",
}: {
  name: ProviderName;
  size?: string;
  label?: boolean;
  className?: string;
}) {
  const m = MARKS[name];
  return (
    <span className={`inline-flex items-center gap-[0.3em] whitespace-nowrap align-[-0.15em] ${className}`}>
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
export function Mark({ name, height = 28, className = "" }: { name: ProviderName; height?: number; className?: string }) {
  const m = MARKS[name];
  return (
    <img
      src={m.src}
      srcSet={m.srcSet}
      alt={name}
      width={Math.round(height * m.ratio)}
      height={height}
      className={`shrink-0 ${className}`}
    />
  );
}

export const providerFor = (provider: string | null | undefined): ProviderName => (provider === "snippe" ? "Snippe" : "PayPal");
