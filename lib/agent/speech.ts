import "server-only";
import { env } from "../env";

/**
 * Spoken replies. When someone sends a voice note, the agent answers with a voice note in their
 * language (Tanzanian Swahili or English). Meta's models do the listening and the thinking; the
 * speaking uses Azure neural voices because Meta has no voice licensed for commercial use in Swahili.
 */

export function speechConfigured() {
  return Boolean(env.azureSpeechKey());
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

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Speaks `text` as an Ogg/Opus voice note (what WhatsApp shows as a voice message). Null when not configured. */
export async function speak(text: string, lang: "sw" | "en"): Promise<{ data: Uint8Array; mimeType: string } | null> {
  if (!speechConfigured()) return null;
  const say = spokenText(text, lang);
  if (!say) return null;
  const voice = lang === "sw" ? env.voiceSw() : env.voiceEn();
  const locale = voice.split("-").slice(0, 2).join("-");
  const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${voice}"><prosody rate="+4%">${xml(say)}</prosody></voice></speak>`;
  const res = await fetch(`https://${env.azureSpeechRegion()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": env.azureSpeechKey(),
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "ogg-24khz-16bit-mono-opus",
      "User-Agent": "sarafupay",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`speech failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { data: new Uint8Array(await res.arrayBuffer()), mimeType: "audio/ogg; codecs=opus" };
}
