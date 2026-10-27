import "server-only";
import { env } from "../env";

/**
 * Spoken replies. When someone sends a voice note, the agent answers with a voice note in their
 * language. Meta's models do all of it: Muse Spark listens and thinks, and Meta's open Seamless
 * M4T v2 model speaks, on our own voice server (voice-server/, set META_VOICE_URL).
 */

export type ReplyVoice = "male" | "female";

export function speechConfigured() {
  return Boolean(env.metaVoiceUrl());
}

const SW_WORDS = new Set(["na", "ya", "kwa", "ni", "wa", "hii", "sana", "asante", "habari", "nime", "tafadhali", "kiasi", "michango", "mchango", "bado", "sawa", "kwenye", "hapa", "yako", "yangu"]);

/** The reply's language, judged from the reply itself (the agent answers in the user's language). */
export function replyLang(text: string, fallback: "sw" | "en"): "sw" | "en" {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  if (!words.length) return fallback;
  const sw = words.filter((w) => SW_WORDS.has(w)).length;
  return sw / words.length >= 0.08 ? "sw" : sw === 0 && words.length >= 4 ? "en" : fallback;
}

/** What to say out loud: no links, codes, markdown or emoji; links are left in the text message. */
export function spokenText(text: string, lang: "sw" | "en"): string {
  const link = lang === "sw" ? "kiungo kiko kwenye ujumbe" : "the link is in the message";
  return text
    .replace(/https?:\/\/\S+/g, ` ${link}. `)
    .replace(/[*_~`]/g, "")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/\b(TZS|TSh|TSH)\s?([\d,]+)/g, (_m, _c, n) => (lang === "sw" ? `shilingi ${n}` : `${n} shillings`))
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/(\.\s*){2,}/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 900);
}

/** Speaks `text` as an Ogg/Opus voice note (what WhatsApp shows as a voice message). Null when not configured. */
export async function speak(text: string, lang: "sw" | "en", voice: ReplyVoice): Promise<{ data: Uint8Array; mimeType: string } | null> {
  if (!speechConfigured()) return null;
  const say = spokenText(text, lang);
  if (!say) return null;
  const res = await fetch(`${env.metaVoiceUrl()}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(env.metaVoiceKey() ? { Authorization: `Bearer ${env.metaVoiceKey()}` } : {}) },
    body: JSON.stringify({ text: say, lang, voice }),
  });
  if (!res.ok) throw new Error(`speech failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { data: new Uint8Array(await res.arrayBuffer()), mimeType: "audio/ogg; codecs=opus" };
}
