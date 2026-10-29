import { NextResponse } from "next/server";
import { generateText, isStepCount, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { withModelFallback } from "@/lib/agent/models";
import { aiConfigured } from "@/lib/env";
import { ownerCollection } from "@/lib/dashboard/auth";
import { takeAiCall } from "@/lib/limits";
import { collectionStats, listContributions, listPayouts, listPledges } from "@/lib/services/core";
import { money } from "@/lib/format";
import type { Collection } from "@/lib/db/schema";

/**
 * The dashboard's Treasurer chat: one question -> one Muse Spark answer (Muse Spark Open as backup).
 * Its tools only read this collection. Nudging pledgers and payouts stay behind buttons and the
 * CONFIRM code, so a chat answer can never move money or message anyone.
 */

const PROMPT = `You are the SarafuPay Treasurer, an AI analyst on the organiser's private dashboard for a group collection (michango).
Organisers must account to their community for every shilling/dollar.
- Answer precisely from the tools, quoting amounts with currency. Never guess a number.
- Keep answers short: a sentence or two, then a few bullet points if needed. Plain text, no tables.
- Reply in the language the organiser writes in (Swahili or English).
- You cannot send messages or move money. To nudge people with open pledges, tell them to press "Send friendly nudges" on the Pledge scoreboard. Payouts are done in WhatsApp with a one-time CONFIRM code.
- When asked, draft a short, warm transparency update they can paste into their WhatsApp group.`;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .min(1)
    .max(20),
});

function tools(col: Collection) {
  const cur = col.currency;
  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  return {
    collection_summary: tool({
      description: "Headline numbers: target, raised, % funded, contributions, paid out, balance, open pledges, deadline, today's date.",
      inputSchema: z.object({}),
      execute: async () => {
        const s = await collectionStats(col);
        return {
          title: col.title,
          target: money(col.targetCents, cur),
          raised: money(s.raisedCents, cur),
          percent: s.percent,
          contributions: s.paidCount,
          paid_out: money(s.paidOutCents, cur),
          balance: money(s.availableCents, cur),
          open_pledges: `${s.openPledgeCount} (${money(s.openPledgeCents, cur)})`,
          deadline: col.deadline,
          today: day(new Date()),
        };
      },
    }),
    list_contributions: tool({
      description: "Every confirmed contribution: who, amount, date, channel and message.",
      inputSchema: z.object({}),
      execute: async () =>
        (await listContributions(col.id, "paid")).map((c) => ({
          name: c.displayName,
          amount: money(c.amountCents, cur),
          paid_on: day(c.paidAt ?? c.createdAt),
          channel: c.source === "sim" ? "chat" : c.source,
          message: c.message ?? undefined,
        })),
    }),
    list_pledges: tool({
      description: "Every pledge (a promise to pay later): who, amount, due date, status (open, fulfilled, cancelled) and whether they were reminded.",
      inputSchema: z.object({}),
      execute: async () =>
        (await listPledges(col.id)).map((p) => ({
          name: p.displayName,
          amount: money(p.amountCents, cur),
          due: p.dueDate,
          status: p.status,
          reminded: Boolean(p.remindedAt),
        })),
    }),
    list_payouts: tool({
      description: "Every payout from the collection: recipient, amount, purpose, status and date.",
      inputSchema: z.object({}),
      execute: async () =>
        (await listPayouts(col.id))
          .filter((p) => p.status !== "cancelled" && p.status !== "awaiting_confirmation")
          .map((p) => ({
            recipient: p.recipientName ?? p.recipientEmail ?? p.recipientPhone ?? "recipient",
            amount: money(p.amountCents, cur),
            purpose: p.note ?? undefined,
            status: p.status,
            sent_on: day(p.executedAt ?? p.createdAt),
          })),
    }),
  };
}

export async function POST(req: Request) {
  const col = await ownerCollection(req.headers.get("x-collection"), req.headers.get("x-owner-key"));
  if (!col) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: "The Treasurer is not set up on this server yet." }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (!(await takeAiCall(`dashboard:${col.code}`, 40)).ok)
    return NextResponse.json({ error: "Too many questions right now. Please wait a few minutes." }, { status: 429 });

  const messages: ModelMessage[] = parsed.data.messages.slice(-12);
  try {
    let model = "";
    const result = await withModelFallback((pick) => {
      model = pick.id;
      return generateText({
        model: pick.model,
        providerOptions: pick.fast,
        system: PROMPT,
        messages,
        tools: tools(col),
        stopWhen: isStepCount(5),
        maxOutputTokens: 900,
        maxRetries: 1,
      });
    });
    return NextResponse.json({ ok: true, text: result.text.trim() || "Sorry, I could not find an answer to that.", model });
  } catch (e) {
    console.error("[dashboard ask]", e);
    return NextResponse.json({ error: "The Treasurer could not answer just now. Please try again." }, { status: 502 });
  }
}
