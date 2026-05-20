import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// PostHog analytics is only active when NEXT_PUBLIC_POSTHOG_ENABLED=true.
// CSP domains are opened only when the flag is set, so the browser enforces
// the restriction even if the env var changes at runtime without a rebuild.
const posthogEnabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true";
// Specific PostHog US-cloud domains — no wildcards.
const POSTHOG_SCRIPT  = "https://us-assets.i.posthog.com https://us.i.posthog.com";
const POSTHOG_CONNECT = "https://us.i.posthog.com https://us-assets.i.posthog.com";

// ---------------------------------------------------------------------------
// Content Security Policy
//
// Constraints that cannot be avoided in this Next.js app:
//   - script-src 'unsafe-inline'  — Next.js inlines __NEXT_DATA__ JSON
//   - style-src  'unsafe-inline'  — Tailwind runtime and framer-motion styles
//   - script-src 'unsafe-eval'    — Turbopack HMR (development only)
//
// What this CSP achieves:
//   - Blocks all inline event handlers and injected scripts from third-party XSS
//   - Restricts fetch/XHR to same-origin (API calls go through Next.js rewrites)
//   - Restricts framing to prevent clickjacking
//   - Allows user-supplied avatar images from any HTTPS domain
//   - Allows canvas.toDataURL() data: URIs for QR code download
//   - When NEXT_PUBLIC_POSTHOG_ENABLED=true, opens only the two PostHog US-cloud
//     domains needed for analytics — no wildcards, no *.posthog.com
// ---------------------------------------------------------------------------
const cspDirectives = [
  "default-src 'self'",

  // unsafe-inline required for Next.js hydration scripts.
  // unsafe-eval added in development only for Turbopack HMR source maps.
  // PostHog loads its SDK from us-assets.i.posthog.com (script-src).
  isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'${posthogEnabled ? ` ${POSTHOG_SCRIPT}` : ""}`
    : `script-src 'self' 'unsafe-inline'${posthogEnabled ? ` ${POSTHOG_SCRIPT}` : ""}`,

  // unsafe-inline required for Tailwind and framer-motion inline styles.
  "style-src 'self' 'unsafe-inline'",

  // https: allows avatarUrl images from any HTTPS host (user-supplied URLs).
  // data: allows canvas.toDataURL() output for QR code download.
  "img-src 'self' data: https:",

  // Fonts are self-hosted via next/font — no external font CDN needed.
  "font-src 'self'",

  // All API calls go through Next.js /api/* rewrites — same-origin only.
  // PostHog capture/decide requests go to us.i.posthog.com (connect-src).
  `connect-src 'self'${posthogEnabled ? ` ${POSTHOG_CONNECT}` : ""}`,

  // Prevent this app from being embedded in a frame anywhere.
  "frame-ancestors 'none'",

  // Disallow plugins (Flash, etc.).
  "object-src 'none'",

  // Restrict <base> tag to prevent base-URL injection.
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  // Clickjacking protection for older browsers that ignore frame-ancestors.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent browsers from MIME-sniffing responses away from declared Content-Type.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Send full URL on same-origin, only origin on cross-origin requests.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict browser APIs not used by this app.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.30"],
  turbopack: {
    root: path.resolve(__dirname, "..")
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_PROXY_URL ?? "http://127.0.0.1:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
