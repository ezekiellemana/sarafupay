import { LANG_COOKIE } from "@/lib/visitor";

/**
 * Language switch: /lang?l=sw&back=/pricing sets the visitor's choice for a year and goes back.
 * The redirect is relative: behind DigitalOcean's proxy the request URL is the internal
 * http://localhost:8080, which must never reach the browser.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const l = url.searchParams.get("l");
  const back = url.searchParams.get("back") ?? "/";
  const safeBack = back.startsWith("/") && !back.startsWith("//") && !back.startsWith("/\\") ? back : "/";
  const headers = new Headers({ Location: safeBack, "Cache-Control": "no-store" });
  if (l === "sw" || l === "en") headers.append("Set-Cookie", `${LANG_COOKIE}=${l}; Path=/; Max-Age=${365 * 24 * 3600}; SameSite=Lax; Secure`);
  return new Response(null, { status: 303, headers });
}
