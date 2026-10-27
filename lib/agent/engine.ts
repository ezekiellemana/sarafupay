import "server-only";
import { generateText, isStepCount, type ModelMessage } from "ai";
import { desc, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { aiConfigured, env, metaConfigured } from "../env";
import { getDb, schema } from "../db";
import { logInbound, sendTo, sendVoiceTo } from "../channels/messaging";
import { chooseReplyVoice, replyLang, speak, speechConfigured, spokenText } from "./speech";
import { saveMedia } from "../services/media";
import * as core from "../services/core";
import { buildTools, type AgentContext } from "./tools";
import { systemPrompt } from "./prompt";
import { withModelFallback, type ModelPick } from "./models";
import { listenOpen, SWAHILI_VOICE_CONTEXT, transcribeVoice, voiceToWav } from "./meta-media";
import { logToolSteps } from "../services/agent-log";
import { checkReply, investigationFacts } from "./verify-claims";
import { langOf, t } from "../i18n";
import { takeAiCall } from "../limits";

export type Incoming = {
  phone: string; // digits for WhatsApp, "sim:<digits>" for simulator
  channel: "whatsapp" | "sim";
  profileName?: string;
  text?: string;
  audio?: { data: Uint8Array; mimeType: string };
  /** A photo (receipt, M-Pesa SMS screenshot…); `text` holds its caption. */
  image?: { data: Uint8Array; mimeType: string };
};

// Serialise messages per phone so replies stay in order.
const queues = new Map<string, Promise<unknown>>();
export function handleIncoming(msg: Incoming): Promise<void> {
  const prev = queues.get(msg.phone) ?? Promise.resolve();
  const next = prev.then(() => process(msg)).catch((e) => console.error("[agent]", e));
  queues.set(msg.phone, next);
  void next.finally(() => {
    if (queues.get(msg.phone) === next) queues.delete(msg.phone);
  });
  return next as Promise<void>;
}

let modelOverride: Parameters<typeof generateText>[0]["model"] | undefined;
/** Test hook: inject a mock language model. */
export function __setModelForTests(m: typeof modelOverride) {
  modelOverride = m;
}


async function history(phone: string, limit = 16): Promise<ModelMessage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.chatLog)
    .where(eq(schema.chatLog.phone, phone))
    .orderBy(desc(schema.chatLog.id))
    .limit(limit + 1);
  rows.reverse();
  rows.pop(); // drop the message we just logged; it's sent separately (may include audio)
  return rows.map((r) =>
    r.direction === "in" ? { role: "user" as const, content: r.text } : { role: "assistant" as const, content: r.text },
  );
}

/**
 * Voice notes become text before the agent reads them.
 * - Swahili speakers: Muse Spark Open (Meta's open weights) listens to the note itself, with
 *   SarafuPay context and Muse Voice Transcribe's draft as a hint. On our Swahili test set this
 *   roughly halves the word error rate of Muse Voice Transcribe alone (see HACKATHON.md).
 * - Everyone else: Muse Voice Transcribe.
 */
async function hearVoice(msg: Incoming, lang: "sw" | "en"): Promise<string | null> {
  if (!msg.audio) return null;
  const draft = metaConfigured()
    ? await transcribeVoice(msg.audio, lang === "en" ? ["English"] : undefined).catch((e) => {
        console.warn("[agent] transcription failed", e instanceof Error ? e.message : e);
        return null;
      })
    : null;
  if (lang === "sw" && env.metaOpenApiKey()) {
    const heard = await listenOpen(msg.audio, { context: SWAHILI_VOICE_CONTEXT, draft }).catch((e) => {
      console.warn("[agent] Muse Spark Open listening failed", e instanceof Error ? e.message : e);
      return null;
    });
    if (heard) return heard;
  }
  return draft;
}

async function replyByVoice(msg: Incoming, picked: string | null, reply: string, lang: "sw" | "en") {
  try {
    const heard = msg.audio ? await voiceToWav(msg.audio).catch(() => null) : null;
    const audio = await speak(reply, lang, chooseReplyVoice(picked, heard));
    if (!audio) return;
    const { url } = await saveMedia({ ...audio, prompt: "voice reply" });
    await sendVoiceTo(msg.phone, url, spokenText(reply, lang));
  } catch (e) {
    console.warn("[agent] voice reply failed", e instanceof Error ? e.message : e);
  }
}

async function process(msg: Incoming): Promise<unknown> {
  const user = await core.getOrCreateUser(msg.phone, msg.channel, msg.profileName);
  let text = (msg.text ?? "").trim();
  const lang = await langOf(msg.phone);
  const transcript = await hearVoice(msg, lang);
  if (transcript) text = [text, transcript].filter(Boolean).join("\n");
  await logInbound(
    msg.phone,
    msg.image
      ? `📷 [photo]${text ? ` ${text}` : ""}`
      : transcript
        ? `🎤 ${transcript}`
        : text || (msg.audio ? "🎤 [voice note]" : "[unsupported message]"),
  );

  // Deterministic money paths: never routed through the LLM.
  const confirm = /^\s*(confirm|thibitisha)\s+(\d{6})\s*$/i.exec(text);
  if (confirm) return sendTo(msg.phone, await core.confirmPayoutByCode(user, confirm[2]));
  const cancel = /^\s*(cancel|ghairi)\s+(\d{6})\s*$/i.exec(text);
  if (cancel) return sendTo(msg.phone, await core.cancelPayoutByCode(user, cancel[2]));

  if (!text && msg.audio && !msg.image) {
    return sendTo(
      msg.phone,
      t(lang, "🎤 Samahani, sikuweza kusikia voice note yako vizuri. Tafadhali itume tena au andika ujumbe.", "🎤 Sorry, I couldn't make out your voice note. Please send it again or type your message."),
    );
  }
  if (!text && !msg.image) {
    return sendTo(msg.phone, t(lang, "Ninasoma maandishi, picha za risiti na kusikiliza voice notes 🙂 Tafadhali tuma mojawapo.", "I can read text and receipt photos, and listen to voice notes 🙂 Please send one of those."));
  }
  if (!aiConfigured() && !modelOverride) {
    return sendTo(msg.phone, "⚙️ The AI brain isn't configured yet (missing MODEL_API_KEY / META_OPEN_API_KEY).");
  }

  const gate = modelOverride ? { ok: true as const } : await takeAiCall(msg.phone);
  if (!gate.ok) {
    if (!gate.notify) return;
    return sendTo(
      msg.phone,
      gate.reason === "sender"
        ? t(lang, "⏳ Ujumbe ni mwingi kwa muda mfupi. Tafadhali subiri dakika chache kisha uendelee.", "⏳ That's a lot of messages in a short time. Please wait a few minutes and continue.")
        : t(lang, "⏳ SarafuPay ina shughuli nyingi leo. Tafadhali jaribu tena baadaye.", "⏳ SarafuPay is very busy today. Please try again later."),
    );
  }

  const owned = await core.listOwnedCollections(user.id);
  const ownedSummary = await Promise.all(
    owned.slice(0, 5).map(async (c) => ({ code: c.code, title: c.title, progress: core.statusLine(c, await core.collectionStats(c)) })),
  );
  const active = user.activeCollectionId ? await core.getCollectionById(user.activeCollectionId) : null;
  const ctx: AgentContext = {
    user,
    channel: msg.channel,
    image: msg.image ?? undefined,
    inputKind: msg.image ? ("photo" as const) : msg.audio ? ("voice" as const) : ("text" as const),
    imageHash: msg.image ? createHash("sha256").update(msg.image.data).digest("hex") : undefined,
  };

  const current: ModelMessage = msg.image
    ? {
        role: "user",
        content: [
          { type: "text", text: text || "(photo with no caption — look at it; if it's a payment receipt or M-Pesa message, read it and handle it)" },
          { type: "file", data: msg.image.data, mediaType: msg.image.mimeType },
        ],
      }
    : { role: "user", content: text + (transcript ? "\n(This came from a voice note, transcribed.)" : "") };

  try {
    const system = systemPrompt({
      user,
      owned: ownedSummary,
      active,
      channel: msg.channel,
      today: new Date().toISOString().slice(0, 10),
      lang,
    });
    const messages = [...(await history(msg.phone)), current];
    const runOnce = (model: Parameters<typeof generateText>[0]["model"], fast: ModelPick["fast"] | undefined) =>
      generateText({
        model,
        system,
        messages,
        tools: buildTools(ctx),
        stopWhen: isStepCount(8),
        maxOutputTokens: 1200, // WhatsApp replies are short; caps cost per step
        maxRetries: 1,
        // Chat replies should feel instant: low reasoning effort.
        ...(fast ? { providerOptions: fast } : {}),
      });
    const run = async (pick: Pick<ModelPick, "model" | "fast">) => {
      try {
        return await runOnce(pick.model, pick.fast);
      } catch (e) {
        // A model that rejects the reasoning setting still gets to answer, just without it.
        if (/thinking|reasoning/i.test(e instanceof Error ? e.message : String(e))) return runOnce(pick.model, undefined);
        throw e;
      }
    };
    let usedModel: string | null = modelOverride ? "test" : null;
    if (modelOverride) ctx.model = "test";
    const result = modelOverride
      ? await run({ model: modelOverride, fast: {} })
      : await withModelFallback(
          async (pick) => {
            ctx.model = `${pick.provider}:${pick.id}`;
            const r = await run(pick);
            usedModel = `${pick.provider}:${pick.id}`;
            return r;
          },
        );
    // Audit trail: every tool the agent used this turn, with its outcome and the model that chose it.
    const toolSteps = result.steps.flatMap((st) =>
      st.toolCalls.map((c) => ({ toolName: c.toolName, input: c.input, output: st.toolResults.find((r) => r.toolCallId === c.toolCallId)?.output })),
    );
    let reply = result.text.trim();
    // An explanation of who paid and why is checked against what the investigation found before it goes out.
    const facts = reply ? investigationFacts(toolSteps) : null;
    if (facts) {
      const check = await checkReply(reply, facts, replyLang(reply, lang));
      reply = check.reply;
      const code = toolSteps.find((s) => s.toolName === "investigate_payments")?.input;
      toolSteps.push({
        toolName: "verify_claims",
        input: { code: (code as { code?: string } | undefined)?.code },
        output: check.verdict === "flagged" ? { error: `flagged: ${check.problems.join("; ")}` } : { result: `${check.verdict}${check.problems.length ? `: ${check.problems.join("; ")}` : ""}` },
      });
    }
    await logToolSteps(msg.phone, usedModel, toolSteps).catch((e) => console.warn("[agent] action log failed", e));
    // The text goes first (it has the links and details, and the voice server may need ~30 s to wake);
    // a voice note then gets a voice note back.
    if (reply) await sendTo(msg.phone, reply);
    if (reply && msg.audio && speechConfigured()) await replyByVoice(msg, ctx.user.replyVoice ?? null, reply, replyLang(reply, lang));
  } catch (e) {
    console.error("[agent] generation failed", e);
    await sendTo(msg.phone, t(lang, "😕 Samahani, nimepata hitilafu kidogo. Tafadhali jaribu tena baada ya muda mfupi.", "😕 Sorry, I hit a problem just now. Please try again in a moment."));
  }
}
