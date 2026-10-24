import "server-only";
import { env, whatsappConfigured } from "../env";

/**
 * Creates and checks the message templates SarafuPay sends outside WhatsApp's 24-hour window.
 * Templates belong to the WhatsApp Business Account (WABA), so every number in it can use them.
 * Docs: developers.facebook.com/docs/whatsapp/business-management-api/message-templates
 */
const graph = () => `https://graph.facebook.com/${env.waGraphVersion()}`;

type Lang = "en" | "sw";
const REMINDER: Record<Lang, { body: string; button: string }> = {
  en: {
    body: "Hi {{1}}, a friendly reminder about your pledge of {{2}} to {{3}}. Due date: {{4}}. Tap the button below to pay securely.",
    button: "Pay now",
  },
  sw: {
    body: "Habari {{1}}, kumbusho la kirafiki kuhusu ahadi yako ya {{2}} kwa {{3}}. Tarehe ya mwisho: {{4}}. Bonyeza kitufe hapa chini kulipa kwa usalama.",
    button: "Lipa sasa",
  },
};

export type TemplateState = { language: string; status: string; reason?: string };

export async function reminderTemplateStatus(wabaId: string): Promise<{ ok: boolean; items: TemplateState[]; error?: string }> {
  if (!whatsappConfigured() || !wabaId) return { ok: false, items: [], error: "not configured" };
  const name = env.waReminderTemplate();
  const res = await fetch(`${graph()}/${wabaId}/message_templates?name=${encodeURIComponent(name)}&fields=name,language,status,rejected_reason`, {
    headers: { Authorization: `Bearer ${env.waToken()}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: { name: string; language: string; status: string; rejected_reason?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) return { ok: false, items: [], error: body.error?.message ?? `HTTP ${res.status}` };
  const items = (body.data ?? [])
    .filter((t) => t.name === name)
    .map((t) => ({ language: t.language, status: t.status, reason: t.rejected_reason && t.rejected_reason !== "NONE" ? t.rejected_reason : undefined }));
  return { ok: true, items };
}

/** Submits the pledge reminder in English and Swahili. Languages that already exist are skipped. */
export async function createReminderTemplates(wabaId: string): Promise<{ ok: boolean; detail: string }> {
  if (!whatsappConfigured()) return { ok: false, detail: "WhatsApp is not configured" };
  if (!/^\d{5,}$/.test(wabaId)) return { ok: false, detail: "WhatsApp Business Account ID looks wrong" };
  const name = env.waReminderTemplate();
  if (!name || name === "off") return { ok: false, detail: "Reminder template is turned off" };
  const existing = await reminderTemplateStatus(wabaId);
  const have = new Set(existing.items.map((i) => i.language));
  const sampleUrl = `${env.appUrl()}/pay/ctb_3c965b1533034ec2`;
  const done: string[] = [];
  for (const lang of ["en", "sw"] as Lang[]) {
    if (have.has(lang)) {
      done.push(`${lang}: already there`);
      continue;
    }
    const t = REMINDER[lang];
    const res = await fetch(`${graph()}/${wabaId}/message_templates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.waToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        language: lang,
        category: "UTILITY",
        components: [
          { type: "BODY", text: t.body, example: { body_text: [["Neema", "TZS 50,000", "Harusi ya Neema & Baraka", "30 Nov 2026"]] } },
          { type: "BUTTONS", buttons: [{ type: "URL", text: t.button, url: `${env.appUrl()}/pay/{{1}}`, example: [sampleUrl] }] },
        ],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { status?: string; error?: { message?: string; error_user_msg?: string } };
    if (!res.ok) return { ok: false, detail: `${lang}: ${body.error?.error_user_msg ?? body.error?.message ?? `HTTP ${res.status}`}` };
    done.push(`${lang}: ${body.status ?? "submitted"}`);
  }
  return { ok: true, detail: done.join(" · ") };
}
