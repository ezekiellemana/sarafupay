import { NextResponse } from "next/server";
import { env, paypalConfigured, snippeConfigured, whatsappConfigured } from "@/lib/env";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { aiUsageToday } from "@/lib/limits";
import { kvConfigured } from "@/lib/kv";
import { primaryModel } from "@/lib/agent/models";

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
      gemini: Boolean(env.geminiApiKey()),
      meta: Boolean(env.metaApiKey()),
      ai_model: primaryModel(),
      whatsapp: whatsappConfigured(),
      simulator: env.simulatorEnabled(),
      keyvalue: kvConfigured(),
      ai_today: await aiUsageToday(),
    },
    { status: db ? 200 : 503 },
  );
}
