import { after, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { verifyWebhook, type SnippeEvent } from "@/lib/snippe/client";
import { applySnippePayment, applySnippePayout } from "@/lib/services/core";

// Snippe webhooks: payment.completed|failed|voided|expired and payout.completed|failed|reversed.
// Signature: HMAC-SHA256 of `${X-Webhook-Timestamp}.${rawBody}`, hex, in X-Webhook-Signature.
export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyWebhook(raw, req.headers.get("x-webhook-signature"), req.headers.get("x-webhook-timestamp"));
  if (!ok) return new Response("invalid signature", { status: 401 });
  let evt: SnippeEvent;
  try {
    evt = JSON.parse(raw) as SnippeEvent;
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const type = evt.type ?? req.headers.get("x-webhook-event") ?? "";
  const d = evt.data ?? {};
  // Snippe may deliver the same event more than once: claim each id once.
  const db = await getDb();
  const eventId = evt.id ?? `${type}:${d.reference ?? d.session_reference ?? ""}:${d.status ?? ""}`;
  const [claimed] = await db.insert(schema.processedEvents).values({ id: `snippe:${eventId}` }).onConflictDoNothing().returning();
  if (!claimed) return NextResponse.json({ ok: true, duplicate: true });

  after(async () => {
    try {
      if (type.startsWith("payment.")) {
        const amount = typeof d.amount === "number" ? d.amount : d.amount?.value;
        const fee = d.settlement?.fees?.value;
        await applySnippePayment({
          contributionId: typeof d.metadata?.contribution_id === "string" ? d.metadata.contribution_id : undefined,
          sessionReference: d.session_reference,
          paymentReference: d.reference,
          status: d.status ?? type.split(".")[1] ?? "",
          amountTzs: amount,
          feeTzs: fee,
          payerPhone: d.customer?.phone,
        });
      } else if (type.startsWith("payout.")) {
        const payoutId = typeof d.metadata?.payout_id === "string" ? d.metadata.payout_id : undefined;
        const [p] = payoutId
          ? await db.select().from(schema.payouts).where(eq(schema.payouts.id, payoutId))
          : d.reference
            ? await db.select().from(schema.payouts).where(eq(schema.payouts.providerRef, d.reference))
            : [];
        if (p) await applySnippePayout(p, d.status ?? type.split(".")[1] ?? "", d.fees?.value, d.failure_reason);
      }
    } catch (e) {
      console.error("[snippe webhook] handler error", type, e);
    }
  });
  return NextResponse.json({ ok: true });
}
