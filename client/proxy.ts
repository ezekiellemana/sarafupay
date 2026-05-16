import { NextResponse, type NextRequest } from "next/server";

// Cookie name must match env.COOKIE_NAME on the Express server (default: sarafupay_token).
const COOKIE_NAME = "sarafupay_token";

// Internal Express API base — same source as next.config.ts rewrites.
const API_BASE = process.env.NEXT_PUBLIC_API_PROXY_URL ?? "http://127.0.0.1:5000";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // No cookie → send to login with the current path so the user can return after login.
  // This is a UX gate only; the Express backend remains the auth source of truth.
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require a role check. The JWT payload only contains { id }, so we
  // must call /api/auth/me to confirm the role — we cannot decode it here safely.
  if (pathname.startsWith("/admin")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Cookie: `${COOKIE_NAME}=${token}` },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!res.ok) {
        // Token expired or rejected by the server → redirect to login.
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const json = await res.json();
      if (json?.data?.user?.role !== "admin") {
        // Valid session but not admin → send to the member dashboard.
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // API unreachable (timeout or network error): let through.
      // Express's requireAdmin middleware returns 403 on every admin API call anyway.
    }
  }

  // Cookie present, all checks passed → proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/payment/start"],
};
