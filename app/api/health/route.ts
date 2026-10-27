import { NextResponse } from "next/server";
import { env, paypalConfigured, snippeConfigured, whatsappConfigured } from "@/lib/env";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { aiUsageToday } from "@/lib/limits";
import { kvConfigured } from "@/lib/kv";
import { primaryModel } from "@/lib/agent/models";
import { detectVisitor } from "@/lib/visitor";

export async function GET() {
  let db = false;
  try {
    await (await getDb()).execute(sql`select 1`);
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json(
    {
      ok: db,
      db,
      snippe: snippeConfigured(),
      paypal: paypalConfigured() ? env.paypalEnv() : false,
      voice: Boolean(env.metaVoiceUrl()),
      meta: Boolean(env.metaApiKey()),
      meta_open: Boolean(env.metaOpenApiKey()),
      ai_model: primaryModel(),
      whatsapp: whatsappConfigured(),
      simulator: env.simulatorEnabled(),
      keyvalue: kvConfigured(),
      ai_today: await aiUsageToday(),
      // Where this request seems to come from (drives example currency/language on public pages).
      visitor: await detectVisitor().then((v) => ({ country: v.country, lang: v.lang, cur: v.cur })),
    },
    { status: db ? 200 : 503 },
  );
}
