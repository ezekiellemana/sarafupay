import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { DEFAULT_RATES, normalizeRates, type Rates } from "../pricing";

const RATES_KEY = "pricing.rates";
let cache: { rates: Rates; at: number } | undefined;
const TTL_MS = 30_000;

/** Current pricing rates (admin-edited values over the defaults). Cached for 30s per process. */
export async function getRates(): Promise<Rates> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rates;
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, RATES_KEY));
  let parsed: unknown = DEFAULT_RATES;
  if (row) {
    try {
      parsed = JSON.parse(row.value);
    } catch {
      console.error("[settings] pricing.rates is not valid JSON; using defaults");
    }
  }
  const rates = normalizeRates(parsed);
  cache = { rates, at: Date.now() };
  return rates;
}

export async function saveRates(input: unknown): Promise<Rates> {
  const rates = normalizeRates(input);
  const db = await getDb();
  const value = JSON.stringify(rates);
  await db
    .insert(schema.settings)
    .values({ key: RATES_KEY, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
  cache = { rates, at: Date.now() };
  return rates;
}
