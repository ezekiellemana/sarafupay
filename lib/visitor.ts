import "server-only";
import { headers } from "next/headers";
import { visitorFor, type Visitor } from "./locale";

/**
 * Country from the edge (Cloudflare sits in front of DigitalOcean App Platform and sets
 * cf-ipcountry), else the region in the browser language ("sw-TZ", "en-GB"). `?country=XX`
 * overrides, for checking how the site looks from elsewhere.
 */
export async function detectVisitor(override?: string | string[]): Promise<Visitor> {
  const h = await headers();
  const forced = typeof override === "string" ? override.toUpperCase() : null;
  const edge = (h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "").toUpperCase();
  const accept = h.get("accept-language") ?? "";
  const region = /^[a-z]{2,3}[-_]([A-Z]{2})/i.exec(accept)?.[1]?.toUpperCase() ?? null;
  const country = (forced && /^[A-Z]{2}$/.test(forced) && forced) || (/^[A-Z]{2}$/.test(edge) && edge !== "XX" && edge !== "T1" ? edge : null) || region;
  return visitorFor(country, accept);
}
