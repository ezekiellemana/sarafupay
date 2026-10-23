/**
 * The SarafuPay mark as a real coin: two faces and a milled gold edge in CSS 3D. It rests, then
 * flips once every few seconds (and right away on hover). Reduced motion keeps it still.
 */
export function CoinMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`coin ${className}`} style={{ "--s": `${size}px` } as React.CSSProperties} aria-hidden>
      <span className="coin-spin">
        {[-2, -1, 0, 1, 2].map((z) => (
          <span key={z} className="coin-edge" style={{ "--z": `${z * 0.6}px` } as React.CSSProperties} />
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
        <img src="/brand/sarafupay-icon.png" alt="" width={size} height={size} className="coin-face coin-front" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
        <img src="/brand/sarafupay-icon.png" alt="" width={size} height={size} className="coin-face coin-back" />
      </span>
    </span>
  );
}
