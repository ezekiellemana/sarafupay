import { NextResponse } from "next/server";
import { payStatus } from "@/lib/services/pay-status";

// The payer's status screen polls this while a payment is in progress. Ids are random, and the
// phone number comes back masked.
export async function GET(_req: Request, ctx: RouteContext<"/api/pay/status/[id]">) {
  const { id } = await ctx.params;
  const s = await payStatus(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s, { headers: { "Cache-Control": "no-store" } });
}
