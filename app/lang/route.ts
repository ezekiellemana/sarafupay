import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/visitor";

/** Language switch: /lang?l=sw&back=/pricing sets the visitor's choice for a year and goes back. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const l = url.searchParams.get("l");
  const back = url.searchParams.get("back") ?? "/";
  const safeBack = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  const res = NextResponse.redirect(new URL(safeBack, url.origin), 303);
  if (l === "sw" || l === "en") res.cookies.set(LANG_COOKIE, l, { maxAge: 365 * 24 * 3600, path: "/", sameSite: "lax" });
  return res;
}
