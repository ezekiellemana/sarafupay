import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { reconcile } from "@/lib/services/reconcile";

// Called every 15 minutes by the scheduled reconcile job (see .do/app.yaml).
// Protected by CRON_SECRET, an app-level secret shared by the web service and the job,
// so it never lives in the repo.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const started = Date.now();
  const report = await reconcile();
  const body = { ok: report.errors.length === 0, ms: Date.now() - started, ...report };
  console.log("[cron] reconcile", JSON.stringify(body));
  return NextResponse.json(body);
}
