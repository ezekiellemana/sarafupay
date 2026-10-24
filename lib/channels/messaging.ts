import "server-only";
import { getDb, schema } from "../db";
import { sendWhatsAppImage, sendWhatsAppText, type SendResult } from "./whatsapp";
import { toWhatsAppFormat } from "../i18n";

export function isSimPhone(phone: string) {
  return phone.startsWith("sim:");
}

export async function logInbound(phone: string, text: string) {
  const db = await getDb();
  await db.insert(schema.chatLog).values({ phone, direction: "in", text });
}

/** Sends a message to a user on their channel and records it in the chat log. Returns whether it was accepted. */
export async function sendTo(phone: string, raw: string): Promise<SendResult> {
  const text = toWhatsAppFormat(raw);
  const db = await getDb();
  await db.insert(schema.chatLog).values({ phone, direction: "out", text });
  if (isSimPhone(phone)) return { ok: true };
  return sendWhatsAppText(phone, text);
}

/**
 * Sends an image (public URL) with a caption. The chat log keeps a "🖼️ <url>" line so the agent's
 * memory and the web simulator both see it.
 */
export async function sendImageTo(phone: string, url: string, caption?: string): Promise<SendResult> {
  const text = toWhatsAppFormat(caption ?? "");
  const db = await getDb();
  await db.insert(schema.chatLog).values({ phone, direction: "out", text: `🖼️ ${url}${text ? `\n${text}` : ""}` });
  if (isSimPhone(phone)) return { ok: true };
  const sent = await sendWhatsAppImage(phone, url, text);
  // An image the user can't receive still leaves them the caption and the link.
  return sent.ok ? sent : sendWhatsAppText(phone, `${text}\n${url}`.trim());
}
