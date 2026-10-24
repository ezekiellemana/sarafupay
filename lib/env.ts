// Central, typed access to configuration. Nothing here throws at import time so
// pages that don't need a given integration still render during local dev.

function get(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  appUrl: () => get("APP_URL", get("RENDER_EXTERNAL_URL", "http://localhost:3000")).replace(/\/$/, ""),
  databaseUrl: () => get("DATABASE_URL"),
  pgliteDir: () => get("PGLITE_DIR", "./.data/pglite"),

  paypalClientId: () => get("PAYPAL_CLIENT_ID"),
  paypalSecret: () => get("PAYPAL_SECRET", get("PAYPAL_CLIENT_SECRET")),
  paypalWebhookId: () => get("PAYPAL_WEBHOOK_ID"),
  /** "live" for real money, anything else = sandbox. */
  paypalEnv: () => (get("PAYPAL_ENV", "sandbox").toLowerCase() === "live" ? "live" : "sandbox"),
  paypalApiBase: () => (env.paypalEnv() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"),

  snippeApiKey: () => get("SNIPPE_API_KEY"),
  snippeWebhookSecret: () => get("SNIPPE_WEBHOOK_SECRET"),
  snippeBaseUrl: () => get("SNIPPE_BASE_URL", "https://api.snippe.sh").replace(/\/$/, ""),
  snippeProfileId: () => get("SNIPPE_PROFILE_ID"),

  /** Owner-only admin pages (/admin?key=...). Empty disables the admin. */
  adminKey: () => get("ADMIN_KEY"),

  geminiApiKey: () => get("GOOGLE_GENERATIVE_AI_API_KEY", get("GEMINI_API_KEY")),
  geminiModel: () => get("GEMINI_MODEL", "gemini-3.8-flash"),
  /** Tried in order when the primary model is overloaded (503), rate-limited (429) or retired (404). */
  geminiModels: () =>
    [get("GEMINI_MODEL", "gemini-3.8-flash"), ...get("GEMINI_FALLBACK_MODELS", "gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.5-flash").split(",")]
      .map((m) => m.trim())
      .filter((m, i, a) => m && a.indexOf(m) === i),

  waToken: () => get("WHATSAPP_ACCESS_TOKEN"),
  waPhoneNumberId: () => get("WHATSAPP_PHONE_NUMBER_ID"),
  waVerifyToken: () => get("WHATSAPP_VERIFY_TOKEN"),
  waAppSecret: () => get("WHATSAPP_APP_SECRET"),
  /** Six-digit two-step PIN used to register the number with the Cloud API (chosen by the owner). */
  /** WhatsApp Business Account that owns the number (WhatsApp Manager → account ID); used for templates. */
  waBusinessAccountId: () => get("WHATSAPP_BUSINESS_ACCOUNT_ID").replace(/[^0-9]/g, ""),
  waPin: () => get("WHATSAPP_PIN").replace(/[^0-9]/g, ""),
  waDisplayNumber: () => get("WHATSAPP_DISPLAY_NUMBER").replace(/[^0-9]/g, ""),
  waGraphVersion: () => get("WHATSAPP_GRAPH_VERSION", "v23.0"),
  /** Approved UTILITY template used for pledge reminders outside the 24h window ("off" disables). */
  waReminderTemplate: () => get("WHATSAPP_REMINDER_TEMPLATE", "pledge_reminder"),

  simulatorEnabled: () => get("ENABLE_SIMULATOR", "true") !== "false",
  agStudioLicense: () => get("NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY"),
};

export function paypalConfigured() {
  return Boolean(env.paypalClientId() && env.paypalSecret());
}
export function snippeConfigured() {
  return Boolean(env.snippeApiKey());
}
export function whatsappConfigured() {
  return Boolean(env.waToken() && env.waPhoneNumberId());
}
