"use server";
import { redirect } from "next/navigation";
import { getContribution, retryContribution, startMobilePayment } from "@/lib/services/core";

/** "Send the prompt again" on the waiting screen: same number, same payment where possible. */
export async function resendPromptAction(contributionId: string): Promise<{ ok: boolean }> {
  const ctb = await getContribution(contributionId);
  if (!ctb?.payerPhone) return { ok: false };
  try {
    await startMobilePayment(ctb.id, ctb.payerPhone);
    return { ok: true };
  } catch (e) {
    console.error("[thanks] resend failed", e);
    return { ok: false };
  }
}

/** "Try again" after a payment ended without money: a new attempt with the same details. */
export async function tryAgainAction(contributionId: string) {
  let target: string;
  try {
    const next = await retryContribution(contributionId);
    target = next.provider === "snippe" ? `/pay/${next.id}/mobile` : `/pay/${next.id}`;
  } catch (e) {
    target = `/pay/error?m=${encodeURIComponent(e instanceof Error ? e.message : "Payment link unavailable")}`;
  }
  redirect(target);
}
