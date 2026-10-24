import "server-only";
import { cookies, headers } from "next/headers";
import { createRequire } from "node:module";
import { visitorFor, type Visitor } from "./locale";

type GeoLookup = { lookup: (ip: string) => { country?: string } | null };
let geo: GeoLookup | null | undefined;

/** MaxMind GeoLite2 country data, bundled in geoip-country (loaded once, lazily). */
function geoip(): GeoLookup | null {
  if (geo !== undefined) return geo;
  try {
    geo = createRequire(import.meta.url)("geoip-country") as GeoLookup;
  } catch (e) {
    console.warn("[visitor] geoip unavailable", e instanceof Error ? e.message : e);
    geo = null;
  }
  return geo;
}

/** The visitor's IP: the edge's header first, then the first X-Forwarded-For hop. */
function clientIp(h: Headers): string | null {
  const ip = h.get("cf-connecting-ip") ?? h.get("do-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0];
  return ip?.trim() || null;
}

export function countryForIp(ip: string | null): string | null {
  if (!ip) return null;
  const c = geoip()?.lookup(ip)?.country?.toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
}

/**
 * Where the visitor is: `?country=XX` (to preview), the edge's country header, the IP looked up
 * in GeoLite2, and only then the region in the browser language ("sw-TZ", "en-GB"), which is a
 * weak hint (many Tanzanians browse in en-GB or en-US).
 */
export async function detectVisitor(override?: string | string[]): Promise<Visitor> {
  const h = await headers();
  const forced = (typeof override === "string" ? override : h.get("x-sp-country"))?.toUpperCase() ?? null;
  const edge = (h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "").toUpperCase();
  const accept = h.get("accept-language") ?? "";
  const region = /^[a-z]{2,3}[-_]([A-Z]{2})/i.exec(accept)?.[1]?.toUpperCase() ?? null;
  const country =
    (forced && /^[A-Z]{2}$/.test(forced) && forced) ||
    (/^[A-Z]{2}$/.test(edge) && edge !== "XX" && edge !== "T1" ? edge : null) ||
    countryForIp(clientIp(h)) ||
    region;
  const v = visitorFor(country, accept);
  // The visitor's own choice of language (header switch) wins over the guess.
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  return chosen === "sw" || chosen === "en" ? { ...v, lang: chosen } : v;
}

export const LANG_COOKIE = "sp_lang";
