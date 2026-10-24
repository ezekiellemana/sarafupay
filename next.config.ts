import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node-only packages that should not be bundled by Next.
  serverExternalPackages: ["@electric-sql/pglite", "@paypal/agent-toolkit", "postgres", "ogg-opus-decoder"],
  // Paths from the old SarafuPay (Express + MongoDB, until Oct 2026). People still have these
  // links and bookmarks; send them to a page that explains the move instead of a 404.
  // (Old collection links, /pay/<slug>, are caught in app/pay/[id]/route.ts.)
  async redirects() {
    const old = ["/dashboard", "/dashboard/:path*", "/login", "/register", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/payment/:path*", "/collections/:path*", "/profile", "/settings"];
    return old.map((source) => ({ source, destination: "/moved", permanent: false }));
  },
};

export default nextConfig;
