/**
 * SarafuPay's own line icons (24px grid, 1.8 stroke, round caps), used instead of emoji so they
 * look the same on every phone. `IconBadge` puts one on a soft round tile.
 */
type P = { className?: string; size?: number };

function Svg({ className, size = 24, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Phone with a coin: mobile money. */
export const PhoneMoney = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10 18.5h3" />
    <circle cx="11.5" cy="10" r="3" />
    <path d="M11.5 8.6v2.8" />
  </Svg>
);

/** Columns under a roof: bank. */
export const Bank = (p: P) => (
  <Svg {...p}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M4.5 9.5h15" />
    <path d="M6.5 12v5M10 12v5M14 12v5M17.5 12v5" />
    <path d="M3.5 20h17" />
  </Svg>
);

/** Card with a stripe and chip. */
export const Card = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19" />
    <path d="M6 15h4" />
  </Svg>
);

export const Lock = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <path d="M12 14.5v2" />
  </Svg>
);

/** Arrow leaving a tray: paid out. */
export const SendOut = (p: P) => (
  <Svg {...p}>
    <path d="M12 14V3.5" />
    <path d="m7.5 8 4.5-4.5L16.5 8" />
    <path d="M4 13.5v4a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-4" />
  </Svg>
);

/** Magnifier with a tick: checked. */
export const SearchCheck = (p: P) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
    <path d="m8 10.6 1.8 1.8L13.2 9" />
  </Svg>
);

export const EyeOff = (p: P) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7a12.6 12.6 0 0 1-3 4.1" />
    <path d="M6.6 6.6C4.6 8 3.2 10 2.5 12c1 2.5 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.3" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const Ban = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const Trash = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V4.5h5V7" />
    <path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const Shield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

type Tone = "forest" | "marigold" | "paper";
const TONES: Record<Tone, string> = {
  forest: "bg-forest/10 text-forest",
  marigold: "bg-marigold/20 text-[#8a5a00]",
  paper: "bg-paper/15 text-paper",
};

/** An icon on a round tile. */
export function IconBadge({ icon: I, tone = "forest", size = 36, className = "" }: { icon: (p: P) => React.ReactNode; tone?: Tone; size?: number; className?: string }) {
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full ${TONES[tone]} ${className}`} style={{ width: size, height: size }} aria-hidden>
      <I size={Math.round(size * 0.56)} />
    </span>
  );
}

/**
 * WhatsApp's official glyph (white version, from the WhatsApp Brand Resource Center, used
 * unmodified per its guidelines) for buttons that open a WhatsApp chat. Not a SarafuPay mark.
 */
export function WhatsAppGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/whatsapp-glyph-white.svg" alt="" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden />;
}
