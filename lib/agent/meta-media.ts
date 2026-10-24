import "server-only";
import { env } from "../env";

/**
 * Meta Model API media endpoints that the chat model doesn't cover:
 * - Muse Voice Transcribe (POST /v1/asr/transcribe): WAV, mono 16-bit PCM at 16/24 kHz, ≤10 min.
 * - Muse Image (POST /v1/images/generations): $0.01 per image.
 * Docs: dev.meta.ai/docs/speech-to-text, dev.meta.ai/docs/image-generation
 */

const auth = () => ({ Authorization: `Bearer ${env.metaApiKey()}` });

/** 16-bit PCM WAV header + samples. */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

/** Mixes channels to mono and halves 48 kHz to 24 kHz (pairwise average is enough for speech). */
export function toMono24k(channels: Float32Array[], sampleRate: number): { samples: Float32Array; rate: number } {
  const n = channels[0]?.length ?? 0;
  const mono = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) mono[i] += ch[i] / channels.length;
  if (sampleRate !== 48000) return { samples: mono, rate: sampleRate };
  const out = new Float32Array(Math.floor(n / 2));
  for (let i = 0; i < out.length; i++) out[i] = (mono[2 * i] + mono[2 * i + 1]) / 2;
  return { samples: out, rate: 24000 };
}

/** WhatsApp voice notes are Ogg/Opus; Muse Voice Transcribe wants WAV. */
export async function voiceToWav(audio: { data: Uint8Array; mimeType: string }): Promise<Uint8Array> {
  if (/wav/i.test(audio.mimeType)) return audio.data;
  if (!/ogg|opus/i.test(audio.mimeType)) throw new Error(`unsupported audio type ${audio.mimeType}`);
  const { OggOpusDecoder } = await import("ogg-opus-decoder");
  const decoder = new OggOpusDecoder();
  await decoder.ready;
  try {
    const { channelData, sampleRate } = await decoder.decodeFile(audio.data);
    const { samples, rate } = toMono24k(channelData, sampleRate);
    return encodeWav(samples, rate);
  } finally {
    decoder.free();
  }
}

/** Speech to text with Muse Voice Transcribe. Returns null when Meta isn't configured or nothing was heard. */
export async function transcribeVoice(audio: { data: Uint8Array; mimeType: string }, languageBias?: string[]): Promise<string | null> {
  if (!env.metaApiKey()) return null;
  const wav = await voiceToWav(audio);
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify({ mode: "PUSH_TO_TALK", model: env.metaTranscribeModel(), audioEncoding: "WAV", ...(languageBias?.length ? { languageBias } : {}) })], {
      type: "application/json",
    }),
  );
  form.append("audio", new Blob([wav as BlobPart], { type: "audio/wav" }), "voice.wav");
  const res = await fetch(`${env.metaBaseUrl()}/asr/transcribe`, { method: "POST", headers: auth(), body: form });
  if (!res.ok) throw new Error(`transcribe failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { transcript?: string };
  const text = body.transcript?.trim();
  return text ? text : null;
}

/** One image from Muse Image, as bytes. */
export async function generateImage(prompt: string, size = "1024x1280"): Promise<{ data: Uint8Array; mimeType: string }> {
  if (!env.metaApiKey()) throw new Error("Meta Model API is not configured");
  const res = await fetch(`${env.metaBaseUrl()}/images/generations`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.metaImageModel(), prompt: prompt.slice(0, 3800), n: 1, size, response_format: "b64_json", output_format: "png" }),
  });
  if (!res.ok) throw new Error(`image generation failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { data?: { b64_json?: string }[]; output_format?: string };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("image generation returned no image");
  return { data: new Uint8Array(Buffer.from(b64, "base64")), mimeType: `image/${body.output_format ?? "png"}` };
}
