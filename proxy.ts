import { NextResponse, type NextRequest } from "next/server";

/**
 * Preview the public site as a visitor from another country: `?country=KE` is passed to every
 * server component of that request (header, footer, page) as `x-sp-country`.
 */
export function proxy(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("x-sp-country", country.toUpperCase());
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon|icon|apple-icon|photos/|brand/|tour/).*)"],
};
