/* eslint-disable @next/next/no-img-element -- tiny local SVG marks; next/image adds nothing here. */

export type ProviderName = "Snippe" | "PayPal";

const MARKS: Record<ProviderName, string> = {
  Snippe: "/brand/snippe-mark.svg",
  PayPal: "/brand/paypal-mark.svg",
};

/**
 * A payment provider's official mark followed by its name, sized to sit inside a line of text.
 * The files in /public/brand are the providers' own artwork, unmodified.
 */
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
  return (
    <span className={`inline-flex items-center gap-[0.3em] whitespace-nowrap align-[-0.15em] ${className}`}>
      <img src={MARKS[name]} alt={label ? "" : name} width={16} height={16} style={{ width: size, height: size }} className="shrink-0" />
      {label ? <span>{name}</span> : null}
    </span>
  );
}

export const providerFor = (provider: string | null | undefined): ProviderName => (provider === "snippe" ? "Snippe" : "PayPal");
