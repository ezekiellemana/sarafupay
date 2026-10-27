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

  /** Meta Model API (Muse models). OpenAI-compatible; the agent prefers it when a key is set. */
  metaApiKey: () => get("MODEL_API_KEY", get("META_MODEL_API_KEY")),
  metaBaseUrl: () => get("META_MODEL_BASE_URL", "https://api.meta.ai/v1").replace(/\/$/, ""),
  /** Chat models tried in order (first is primary). */
  metaModels: () =>
    get("META_MODELS", "muse-spark-1.3,muse-spark-1.2")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  /** low | medium | high … ("minimal" for fastest replies). Muse Spark rejects "none". */
  metaReasoningEffort: () => get("META_REASONING_EFFORT", "low"),
  /**
   * Muse Spark Open (Meta's open-weights model) on any OpenAI-compatible host: Fireworks, Together,
   * Baseten, Groq, Nebius… Used after the Meta Model API.
   */
  metaOpenApiKey: () => get("META_OPEN_API_KEY"),
  metaOpenBaseUrl: () => get("META_OPEN_BASE_URL", "https://api.fireworks.ai/inference/v1").replace(/\/$/, ""),
  metaOpenModel: () => get("META_OPEN_MODEL", "accounts/fireworks/models/muse-spark-open"),
  metaImageModel: () => get("META_IMAGE_MODEL", "muse-image-1.0"),
  metaTranscribeModel: () => get("META_TRANSCRIBE_MODEL", "muse-voice-transcribe-1.0"),
  // Spoken replies to voice notes: our own server running Meta's open Seamless M4T v2 voice model.
  metaVoiceUrl: () => get("META_VOICE_URL").replace(/\/$/, ""),
  metaVoiceKey: () => get("META_VOICE_KEY"),

  waToken: () => get("WHATSAPP_ACCESS_TOKEN"),
  waPhoneNumberId: () => get("WHATSAPP_PHONE_NUMBER_ID"),
  waVerifyToken: () => get("WHATSAPP_VERIFY_TOKEN"),
  waAppSecret: () => get("WHATSAPP_APP_SECRET"),
  /** WhatsApp Business Account that owns the number (WhatsApp Manager → account ID); used for templates. */
  waBusinessAccountId: () => get("WHATSAPP_BUSINESS_ACCOUNT_ID").replace(/[^0-9]/g, ""),
  /** Six-digit two-step PIN used to register the number with the Cloud API (chosen by the owner). */
  waPin: () => get("WHATSAPP_PIN").replace(/[^0-9]/g, ""),
  waDisplayNumber: () => get("WHATSAPP_DISPLAY_NUMBER").replace(/[^0-9]/g, ""),
  waGraphVersion: () => get("WHATSAPP_GRAPH_VERSION", "v23.0"),
  /** Approved UTILITY template used for pledge reminders outside the 24h window ("off" disables). */
  waReminderTemplate: () => get("WHATSAPP_REMINDER_TEMPLATE", "pledge_reminder"),

  /**
   * Ed25519 key that signs Trust Copilot evidence cards: a base64 32-byte seed
   * (`openssl rand -base64 32`). Keep it stable; changing it makes older cards show as signed by an old key.
   */
  evidenceSigningKey: () => get("EVIDENCE_SIGNING_KEY"),
  /** Vision model that locates and re-reads receipt fields (any Muse Spark model with image input). */
  metaVisionModel: () => get("META_VISION_MODEL", env.metaModels()[0] ?? "muse-spark-1.3"),
  metaSegmentModel: () => get("META_SEGMENT_MODEL", "sam-3.1"),

  simulatorEnabled: () => get("ENABLE_SIMULATOR", "true") !== "false",
  agStudioLicense: () => get("NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY"),
};

export function paypalConfigured() {
  return Boolean(env.paypalClientId() && env.paypalSecret());
}
export function snippeConfigured() {
  return Boolean(env.snippeApiKey());
}
export function metaConfigured() {
  return Boolean(env.metaApiKey());
}
/** Some model the agent can talk to. */
export function aiConfigured() {
  return Boolean(env.metaApiKey() || env.metaOpenApiKey());
}
export function whatsappConfigured() {
  return Boolean(env.waToken() && env.waPhoneNumberId());
}
