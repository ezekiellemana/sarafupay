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
const MONTHS = {
  sw: ["Januari", "Februari", "Machi", "Aprili", "Mei", "Juni", "Julai", "Agosti", "Septemba", "Oktoba", "Novemba", "Desemba"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function spokenText(text: string, lang: "sw" | "en"): string {
  const link = lang === "sw" ? "kiungo kiko kwenye ujumbe" : "the link is in the message";
  return text
    .replace(/https?:\/\/\S+/g, ` ${link}. `)
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, _y, mo, d) => `${lang === "sw" ? "tarehe " : ""}${Number(d)} ${MONTHS[lang][Number(mo) - 1] ?? mo}`)
    .replace(/^\s*[•\-–]\s*/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/\b(TZS|TSh|TSH)\s?([\d,]+)/g, (_m, _c, n) => (lang === "sw" ? `shilingi ${n}` : `${n} shillings`))
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/([:;,?!])\s*\./g, "$1")
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

/**
 * Speaks `text` over a picture (a slow zoom) or a short clip, as an MP4 that WhatsApp plays as a
 * video. Made on the voice server, which has ffmpeg. Null when the voice server isn't configured.
 */
export async function speakOver(
  text: string,
  lang: "sw" | "en",
  voice: ReplyVoice,
  visual: { image: Uint8Array } | { clip: Uint8Array },
): Promise<{ data: Uint8Array; mimeType: string } | null> {
  if (!speechConfigured()) return null;
  const say = spokenText(text, lang);
  if (!say) return null;
  const res = await fetch(`${env.metaVoiceUrl()}/video`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(env.metaVoiceKey() ? { Authorization: `Bearer ${env.metaVoiceKey()}` } : {}) },
    body: JSON.stringify({
      text: say,
      lang,
      voice,
      ...("clip" in visual ? { video_b64: Buffer.from(visual.clip).toString("base64") } : { image_b64: Buffer.from(visual.image).toString("base64") }),
    }),
  });
  if (!res.ok) throw new Error(`video voice-over failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { data: new Uint8Array(await res.arrayBuffer()), mimeType: "video/mp4" };
}

/** Median pitch (Hz) of the voiced parts of a 16-bit PCM WAV, by autocorrelation. 0 when nothing voiced. */
export function voicePitch(wav: Uint8Array): number {
  const v = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const rate = v.getUint32(24, true);
  const n = Math.min((wav.byteLength - 44) >> 1, rate * 15); // the first 15 s is plenty
  const x = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs((x[i] = v.getInt16(44 + i * 2, true) / 32768)));
  if (!peak) return 0;
  const frame = Math.round(rate * 0.04);
  const [lo, hi] = [Math.floor(rate / 400), Math.floor(rate / 70)];
  const pitches: number[] = [];
  for (let start = 0; start + frame + hi < n; start += frame >> 1) {
    let mean = 0;
    for (let i = 0; i < frame; i++) mean += x[start + i];
    mean /= frame;
    let energy = 0;
    for (let i = 0; i < frame; i++) energy += ((x[start + i] - mean) / peak) ** 2;
    if (Math.sqrt(energy / frame) < 0.02) continue; // silence
    let best = 0;
    let bestLag = 0;
    for (let lag = lo; lag < hi; lag++) {
      let c = 0;
      for (let i = 0; i + lag < frame; i++) c += (x[start + i] - mean) * (x[start + i + lag] - mean);
      if (c > best) [best, bestLag] = [c, lag];
    }
    let c0 = 0;
    for (let i = 0; i < frame; i++) c0 += (x[start + i] - mean) ** 2;
    if (bestLag && best > 0.3 * c0) pitches.push(rate / bestLag);
  }
  if (pitches.length < 3) return 0;
  pitches.sort((a, b) => a - b);
  return pitches[pitches.length >> 1];
}

/**
 * The voice to answer with: the one the user picked, otherwise the opposite of how their voice note
 * sounds (a higher voice gets the male voice, a lower one the female voice), otherwise the default.
 * Only the pitch of this one note is used; nothing about the person is stored.
 */
export function chooseReplyVoice(picked: string | null | undefined, wav: Uint8Array | null): ReplyVoice {
  if (picked === "male" || picked === "female") return picked;
  const f0 = wav ? voicePitch(wav) : 0;
  if (f0 >= 170) return "male";
  if (f0 > 0 && f0 <= 155) return "female";
  return env.metaVoiceDefault();
}
