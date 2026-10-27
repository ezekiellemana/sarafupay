import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Collection, Contribution, User } from "../db/schema";
import { env } from "../env";
import { money } from "../format";
import { langOf, t, type Lang } from "../i18n";
import { generateImage, generateVideo } from "../agent/meta-media";
import { speakOver, speechConfigured } from "../agent/speech";
import { sendTo, sendVideoTo } from "../channels/messaging";
import { firstName, getUser } from "./core";
import { nameMatches } from "./investigate";
import { saveMedia } from "./media";
import { MOOD } from "./sharecard";

/**
 * Thank-you videos: everyone who paid gets a short personal video on WhatsApp, with their name
 * spoken in their language. Meta's models make all of it: Muse Image draws the card, Muse Wonder
 * animates it (while it isn't enabled for our key, the card itself is used, with a slow zoom), and
 * Seamless speaks the thanks on our voice server, which also puts picture and voice together.
 * The words come from the records (name, amount, collection), never from a model, so they're right.
 */

const MAX_PER_RUN = 10;

export function thankYouCardPrompt(col: Pick<Collection, "title" | "category">): string {
  const mood = MOOD[col.category] ?? MOOD.other;
  return [
    `Portrait thank-you card for people who contributed to a community collection ("mchango") in Tanzania.`,
    `Scene and mood: ${mood}, grateful and warm.`,
    `Large, elegant, perfectly spelled text in the middle: "Asante!". Below it, smaller: "Thank you".`,
    `No other text, no numbers, no names, no logos. Rich illustration, soft light, room around the text.`,
  ].join(" ");
}

export const THANK_YOU_CLIP_PROMPT =
  "Gently animate this thank-you card: petals and confetti drifting down, warm light shimmering, a slow camera push-in. " +
  "Keep the text exactly as it is. Calm, joyful, 6 seconds.";

/** What is said in the video. Amounts are spoken only in shillings, which the voice reads well. */
export function thankYouLine(c: Pick<Contribution, "displayName" | "amountCents" | "currency">, col: Pick<Collection, "title">, organiser: string | null, L: Lang): string {
  const name = firstName(c.displayName);
  const amount = c.currency === "TZS" ? ` ${t(L, "wa", "of")} ${money(c.amountCents, c.currency)}` : "";
  return t(
    L,
    `Asante sana ${name}! ${organiser ? `${organiser} anakushukuru` : "Tunakushukuru"} kwa mchango wako${amount} kwa ${col.title}. Tunathamini sana upendo wako.`,
    `Thank you so much, ${name}! ${organiser ? `${organiser} is` : "We are"} grateful for your contribution${amount} to ${col.title}. Your kindness means a lot.`,
  );
}

function caption(c: Contribution, col: Collection, organiser: string | null, L: Lang): string {
  return t(
    L,
    `🎉 Asante ${firstName(c.displayName)}! Mchango wako wa *${money(c.amountCents, c.currency)}* kwa *${col.title}* umepokelewa.${organiser ? `\n— ${organiser}` : ""}`,
    `🎉 Thank you, ${firstName(c.displayName)}! Your *${money(c.amountCents, c.currency)}* for *${col.title}* was received.${organiser ? `\n— ${organiser}` : ""}`,
  );
}

const runs = new Set<Promise<void>>();
/** Tests wait for the videos being made in the background. */
export async function __waitForThankYous() {
  while (runs.size) await Promise.all([...runs]);
}

export type ThankYouStart = { sending: string[]; skipped: { name: string; reason: string }[]; already_thanked: number; voice_ready: boolean };

/**
 * Starts making and sending thank-you videos to paid contributors who haven't had one (only `name`
 * if given). Returns at once; the videos follow in the background (about 20 s each), and the
 * organiser gets a summary and a copy of the first one when they're done.
 */
export async function sendThankYouVideos(col: Collection, organiser: User, name?: string): Promise<ThankYouStart> {
  const db = await getDb();
  const paid = await db
    .select()
    .from(schema.contributions)
    .where(and(eq(schema.contributions.collectionId, col.id), eq(schema.contributions.status, "paid")))
    .orderBy(asc(schema.contributions.paidAt));
  const wanted = name ? paid.filter((c) => nameMatches(name, c.displayName)) : paid;
  const out: ThankYouStart = { sending: [], skipped: [], already_thanked: wanted.filter((c) => c.thankedAt).length, voice_ready: speechConfigured() };
  if (!out.voice_ready) return out;
  const todo: { c: Contribution; phone: string }[] = [];
  for (const c of wanted.filter((x) => !x.thankedAt)) {
    const user = c.contributorId ? await getUser(c.contributorId) : undefined;
    if (!user?.phone || user.id === organiser.id) {
      out.skipped.push({ name: c.displayName, reason: user ? "that's you" : "paid on the web, no WhatsApp number" });
      continue;
    }
    if (todo.length >= MAX_PER_RUN) {
      out.skipped.push({ name: c.displayName, reason: `more than ${MAX_PER_RUN} at once; ask again for the rest` });
      continue;
    }
    // Claim it first, so two requests never send the same person two videos.
    const [claimed] = await db
      .update(schema.contributions)
      .set({ thankedAt: new Date() })
      .where(and(eq(schema.contributions.id, c.id), isNull(schema.contributions.thankedAt)))
      .returning({ id: schema.contributions.id });
    if (!claimed) continue;
    todo.push({ c, phone: user.phone });
    out.sending.push(c.displayName);
  }
  if (todo.length) {
    const run = makeAndSend(col, organiser, todo)
      .catch((e) => console.error("[thankyou] run failed", e))
      .finally(() => runs.delete(run));
    runs.add(run);
  }
  return out;
}

async function makeAndSend(col: Collection, organiser: User, todo: { c: Contribution; phone: string }[]) {
  const db = await getDb();
  const orgL = await langOf(organiser.phone);
  const release = (ids: string[]) =>
    Promise.all(ids.map((id) => db.update(schema.contributions).set({ thankedAt: null }).where(eq(schema.contributions.id, id))));
  let visual: { image: Uint8Array } | { clip: Uint8Array };
  let via: "muse-wonder" | "muse-image";
  try {
    const card = await generateImage(thankYouCardPrompt(col), "1024x1280");
    const clip = await generateVideo(THANK_YOU_CLIP_PROMPT, card).catch((e) => {
      console.warn("[thankyou] Muse Wonder failed, using the card", e);
      return null;
    });
    [visual, via] = clip ? [{ clip }, "muse-wonder"] : [{ image: card.data }, "muse-image"];
  } catch (e) {
    console.error("[thankyou] card failed", e);
    await release(todo.map((x) => x.c.id));
    await sendTo(organiser.phone, t(orgL, "⚠️ Sikuweza kutengeneza video za asante sasa hivi. Jaribu tena baadaye.", "⚠️ I couldn't make the thank-you videos just now. Please try again later."));
    return;
  }
  const sent: string[] = [];
  const failed: string[] = [];
  let preview: { url: string; name: string } | null = null;
  for (const { c, phone } of todo) {
    try {
      const L = await langOf(phone);
      const video = await speakOver(thankYouLine(c, col, organiser.name, L), L, env.metaVoiceDefault(), visual);
      if (!video) throw new Error("voice server not configured");
      const saved = await saveMedia({ data: video.data, mimeType: video.mimeType, collectionId: col.id, prompt: `thank-you video (${via})` });
      const r = await sendVideoTo(phone, saved.url, caption(c, col, organiser.name, L));
      if (!r.ok) throw new Error(`send failed: ${r.reason}`);
      sent.push(c.displayName);
      preview ??= { url: saved.url, name: c.displayName };
    } catch (e) {
      console.error("[thankyou] video failed for", c.id, e);
      await release([c.id]);
      failed.push(c.displayName);
    }
  }
  const summary = [
    sent.length ? t(orgL, `✅ Video za asante zimetumwa kwa: ${sent.join(", ")}.`, `✅ Thank-you videos sent to: ${sent.join(", ")}.`) : "",
    failed.length
      ? t(orgL, `⚠️ Hazikutumwa kwa: ${failed.join(", ")}. Niambie nijaribu tena.`, `⚠️ Not sent to: ${failed.join(", ")}. Ask me to try again.`)
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  if (preview) await sendVideoTo(organiser.phone, preview.url, `${summary}\n${t(orgL, `👆 Hii ndiyo video ${preview.name} alipokea.`, `👆 This is the video ${preview.name} received.`)}`);
  else await sendTo(organiser.phone, summary);
}
