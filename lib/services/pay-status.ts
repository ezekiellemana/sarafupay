import "server-only";
import type { Contribution } from "../db/schema";
import { money } from "../format";
import { maskPhone, networkOf } from "../networks";
import { checkSnippeContribution, collectionStats, getCollectionById, getContribution } from "./core";

/**
 * What a payer's status screen shows, for every stage of a payment, mobile money or card.
 * - prompt_needed: mobile money, no PIN prompt sent yet
 * - waiting_pin:  prompt sent, waiting for the payer's PIN
 * - confirming:   card approved at PayPal, capture still settling
 * - card_open:    card payment started but not finished (or cancelled at PayPal)
 * - paid / failed
 */
export type PayState = "prompt_needed" | "waiting_pin" | "confirming" | "card_open" | "paid" | "failed";

export type PayStatus = {
  id: string;
  state: PayState;
  method: "mobile" | "card";
  failReason: "expired" | "declined" | "cancelled" | null;
  amount: string;
  network: string | null;
  phone: string;
  /** Seconds since the PIN prompt was last sent. */
  promptAge: number | null;
  ref: string | null;
  collection: { code: string; title: string; percent: number; raised: string; target: string };
};

const lastAsked = new Map<string, number>();

/** Ask Snippe about a waiting payment at most every 8 s per payment, whoever is polling. */
async function refresh(ctb: Contribution): Promise<Contribution> {
  if (ctb.provider !== "snippe" || ctb.status !== "pending" || !ctb.providerRef) return ctb;
  const now = Date.now();
  if (now - (lastAsked.get(ctb.id) ?? 0) < 8000) return ctb;
  lastAsked.set(ctb.id, now);
  if (lastAsked.size > 5000) lastAsked.clear();
  return (await checkSnippeContribution(ctb.id).catch(() => undefined)) ?? ctb;
}

function failReason(c: Contribution): PayStatus["failReason"] {
  if (c.status !== "failed") return null;
  if (c.failReason === "expired") return "expired";
  if (c.failReason === "voided" || c.failReason === "cancelled") return "cancelled";
  return "declined";
}

export async function payStatus(id: string): Promise<PayStatus | null> {
  const found = id.startsWith("ctb_") ? await getContribution(id) : undefined;
  if (!found) return null;
  const ctb = await refresh(found);
  const col = await getCollectionById(ctb.collectionId);
  if (!col) return null;
  const stats = await collectionStats(col);
  const mobile = ctb.provider === "snippe";
  const state: PayState =
    ctb.status === "paid"
      ? "paid"
      : ctb.status === "failed" || ctb.status === "refunded"
        ? "failed"
        : mobile
          ? ctb.providerRef
            ? "waiting_pin"
            : "prompt_needed"
          : ctb.paypalCaptureId
            ? "confirming"
            : "card_open";
  return {
    id: ctb.id,
    state,
    method: mobile ? "mobile" : "card",
    failReason: failReason(ctb),
    amount: ctb.payCurrency && ctb.payAmountCents != null ? money(ctb.payAmountCents, ctb.payCurrency) : money(ctb.amountCents, ctb.currency),
    network: mobile ? networkOf(ctb.payerPhone) : null,
    phone: mobile ? maskPhone(ctb.payerPhone) : "",
    promptAge: ctb.promptSentAt ? Math.max(0, Math.round((Date.now() - ctb.promptSentAt.getTime()) / 1000)) : null,
    ref: ctb.status === "paid" ? (mobile ? ctb.providerRef : ctb.paypalCaptureId) : null,
    collection: { code: col.code, title: col.title, percent: stats.percent, raised: money(stats.raisedCents, col.currency), target: money(col.targetCents, col.currency) },
  };
}
