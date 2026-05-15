import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/payment/start"];

export function proxy(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  const hasCookie = request.cookies.has("sarafupay_token");

  if (isProtected && !hasCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/payment/start"]
};
