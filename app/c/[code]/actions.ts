"use server";
import { redirect } from "next/navigation";
import { createContribution, findCollection, startMobilePayment } from "@/lib/services/core";
import { toCents } from "@/lib/format";

export async function contributeAction(code: string, form: FormData) {
  const col = await findCollection(code);
  if (!col) redirect("/");
  const name = String(form.get("name") ?? "").trim() || "Anonymous";
  const message = String(form.get("message") ?? "").trim();
  const provider = form.get("method") === "card_or_paypal" ? "paypal" : "snippe";
  const phone = String(form.get("phone") ?? "").trim();
  const payCurrency = String(form.get("currency") ?? "").trim().toUpperCase() || undefined;
  let cents: number;
  try {
    cents = toCents(String(form.get("amount") ?? ""));
  } catch {
    redirect(`/c/${col.code}?err=amount#chip-in`);
  }
  let id: string;
  try {
    const ctb = await createContribution({
      collection: col,
      displayName: name,
      amountCents: cents,
      source: "web",
      message,
      provider,
      payerPhone: provider === "snippe" && phone ? phone : undefined,
      payCurrency: provider === "paypal" ? payCurrency : undefined,
    });
    id = ctb.id;
  } catch (e) {
    redirect(`/c/${col.code}?err=${encodeURIComponent(e instanceof Error ? e.message : "error")}#chip-in`);
  }
  if (provider === "snippe") {
    // Mobile money: the PIN prompt goes straight to the number they typed; no checkout page.
    let target = `/c/${col.code}/thanks?ctb=${id}`;
    try {
      await startMobilePayment(id, phone);
    } catch (e) {
      console.error("[chip-in] prompt failed", e);
      target = `/pay/${id}/mobile?err=prompt`;
    }
    redirect(target);
  }
  redirect(`/pay/${id}`);
}
