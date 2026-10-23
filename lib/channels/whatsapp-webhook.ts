import "server-only";
import { env, whatsappConfigured } from "../env";

/**
 * Per-number webhook routing (Meta "webhook overrides"). Several numbers can share one Meta app
 * whose default callback URL serves another app; this points only THIS number
 * (WHATSAPP_PHONE_NUMBER_ID) at this deployment's /api/whatsapp. Meta checks the number's override
 * first, then the account's, then the app's default URL.
 * Docs: developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/override
 * The access token stays on the server; nothing here is sent to the browser.
 */
const graph = () => `https://graph.facebook.com/${env.waGraphVersion()}`;
export const ourWebhookUrl = () => `${env.appUrl()}/api/whatsapp`;

export type WebhookStatus =
  | { configured: false }
  | { configured: true; phoneOverride?: string; appDefault?: string; accountOverride?: string; pointsHere: boolean; error?: string };

export async function webhookStatus(): Promise<WebhookStatus> {
  if (!whatsappConfigured()) return { configured: false };
  try {
    const res = await fetch(`${graph()}/${env.waPhoneNumberId()}?fields=webhook_configuration`, {
      headers: { Authorization: `Bearer ${env.waToken()}` },
      cache: "no-store",
    });
    const body = (await res.json()) as {
      webhook_configuration?: { phone_number?: string; application?: string; whatsapp_business_account?: string };
      error?: { message?: string };
    };
    if (!res.ok) return { configured: true, pointsHere: false, error: body.error?.message ?? `HTTP ${res.status}` };
    const w = body.webhook_configuration ?? {};
    const effective = w.phone_number || w.whatsapp_business_account || w.application;
    return {
      configured: true,
      phoneOverride: w.phone_number,
      accountOverride: w.whatsapp_business_account,
      appDefault: w.application,
      pointsHere: effective === ourWebhookUrl(),
    };
  } catch (e) {
    return { configured: true, pointsHere: false, error: e instanceof Error ? e.message : "request failed" };
  }
}

/** Points this number's webhooks at this deployment. Meta verifies the URL with WHATSAPP_VERIFY_TOKEN. */
export async function pointNumberHere(): Promise<{ ok: boolean; detail?: string }> {
  if (!whatsappConfigured()) return { ok: false, detail: "WhatsApp is not configured" };
  if (!env.waVerifyToken()) return { ok: false, detail: "WHATSAPP_VERIFY_TOKEN is missing" };
  const res = await fetch(`${graph()}/${env.waPhoneNumberId()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.waToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ webhook_configuration: { override_callback_uri: ourWebhookUrl(), verify_token: env.waVerifyToken() } }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
  return res.ok && body.success ? { ok: true } : { ok: false, detail: body.error?.message ?? `HTTP ${res.status}` };
}
