import "server-only";
import { tool, type Tool } from "ai";
import { z } from "zod";
import type { Collection, User } from "../db/schema";
import { money, toCents } from "../format";
import { paypalConfigured } from "../env";
import { sendTo } from "../channels/messaging";
import * as core from "../services/core";
import { collectionUrl, dashboardUrl, payUrl, shareMessage } from "../services/links";
import { createAndSendPledgeInvoice, toolkitToolsForAgent } from "../paypal/toolkit";
import { getDb, schema } from "../db";
import { and, eq, ilike } from "drizzle-orm";
import { langOf, t } from "../i18n";
import { RATE_LABELS, RATE_KEYS, rateSummary } from "../pricing";
import { getRates } from "../services/settings";

export type AgentContext = { user: User; channel: "whatsapp" | "sim" };

const code = z.string().describe("Collection code, e.g. NEEMA24");
const amount = z.number().positive().describe("Amount, e.g. 20000 (TZS) or 25 (USD)");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date in YYYY-MM-DD");

class ToolError extends Error {}

async function mustFind(c: string): Promise<Collection> {
  const col = await core.findCollection(c);
  if (!col) throw new ToolError(`No collection with code ${c}. Ask the user to double-check the code.`);
  return col;
}

function mustOwn(col: Collection, ctx: AgentContext) {
  if (col.ownerId !== ctx.user.id) throw new ToolError("Only the collection owner can do this. Politely refuse.");
}

/** Wraps execute so domain errors come back to the model as data instead of crashing the run. */
function safe<I, O>(fn: (input: I) => Promise<O>) {
  return async (input: I) => {
    try {
      return await fn(input);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  };
}

export function buildTools(ctx: AgentContext): Record<string, Tool> {
  const refreshUser = async () => (ctx.user = (await core.getUser(ctx.user.id)) ?? ctx.user);

  const tools: Record<string, Tool> = {
    update_my_profile: tool({
      description: "Save the user's display name and/or PayPal email (used for USD payouts to them).",
      inputSchema: z.object({ name: z.string().min(1).max(60).optional(), paypal_email: z.string().email().optional() }),
      execute: safe(async ({ name, paypal_email }) => {
        await core.updateUser(ctx.user.id, {
          ...(name ? { name } : {}),
          ...(paypal_email ? { paypalEmail: paypal_email } : {}),
        });
        await refreshUser();
        return { ok: true, name: ctx.user.name, paypal_email: ctx.user.paypalEmail };
      }),
    }),

    create_collection: tool({
      description:
        "Create a new collection (michango) owned by the current user. Only call once you know at least a title and target amount and the user's name.",
      inputSchema: z.object({
        title: z.string().min(3).max(120),
        purpose: z.string().max(500).optional(),
        category: z.enum(["wedding", "funeral", "medical", "education", "community", "nonprofit", "celebration", "other"]),
        target_amount: amount,
        currency: z.enum(["TZS", "USD"]).default("TZS").describe("TZS unless the organiser clearly wants a USD target"),
        deadline: date.optional(),
        payout_paypal_email: z.string().email().optional(),
      }),
      execute: safe(async (i) => {
        if (!ctx.user.name) throw new ToolError("Ask for the user's name first and save it with update_my_profile.");
        const col = await core.createCollection({
          ownerId: ctx.user.id,
          title: i.title,
          purpose: i.purpose,
          category: i.category,
          targetCents: toCents(i.target_amount),
          currency: i.currency,
          deadline: i.deadline,
          payoutEmail: i.payout_paypal_email ?? ctx.user.paypalEmail ?? undefined,
        });
        await core.updateUser(ctx.user.id, { activeCollectionId: col.id });
        return {
          ok: true,
          code: col.code,
          public_page: collectionUrl(col.code),
          owner_dashboard: dashboardUrl(col),
          share_message: shareMessage(col, ctx.user.name, await langOf(ctx.user.phone)),
          note: "Give the owner the code, then paste the share_message verbatim so they can forward it to their groups. Mention the private dashboard link.",
        };
      }),
    }),

    list_my_collections: tool({
      description: "List collections the user owns with progress.",
      inputSchema: z.object({}),
      execute: safe(async () => {
        const owned = await core.listOwnedCollections(ctx.user.id);
        return Promise.all(
          owned.map(async (c) => {
            const s = await core.collectionStats(c);
            return { code: c.code, title: c.title, status: c.status, progress: core.statusLine(c, s), available_balance: money(s.availableCents, c.currency) };
          }),
        );
      }),
    }),

    open_collection: tool({
      description:
        "Look up a collection by code (e.g. when someone writes 'Contribute NEEMA24') and make it the user's active collection. Returns public details.",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        await core.updateUser(ctx.user.id, { activeCollectionId: col.id });
        const s = await core.collectionStats(col);
        const owner = await core.getUser(col.ownerId);
        return {
          code: col.code,
          title: col.title,
          purpose: col.purpose,
          organiser: owner?.name ?? "the organiser",
          status: col.status,
          deadline: col.deadline,
          currency: col.currency,
          progress: core.statusLine(col, s),
          is_owner: col.ownerId === ctx.user.id,
        };
      }),
    }),

    collection_report: tool({
      description:
        "Detailed report for a collection: who paid, pending links, open pledges (who has not paid yet), payouts and balance. Owners get names; others get totals only.",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        const s = await core.collectionStats(col);
        const base = {
          code: col.code,
          title: col.title,
          progress: core.statusLine(col, s),
          raised: money(s.raisedCents, col.currency),
          paid_out: money(s.paidOutCents, col.currency),
          available_balance: money(s.availableCents, col.currency),
          balances: s.balances.map((b) => ({
            currency: b.currency,
            paid_by_contributors: money(b.raisedCents, b.currency),
            after_fees: money(b.netCents, b.currency),
            withdrawn: money(b.paidOutCents, b.currency),
            available: money(b.availableCents, b.currency),
            rail: b.currency === "TZS" ? "mobile money via Snippe" : "card/PayPal via PayPal",
          })),
          open_pledges_total: money(s.openPledgeCents, col.currency),
        };
        if (col.ownerId !== ctx.user.id) return base;
        const [paid, plg, pays] = await Promise.all([
          core.listContributions(col.id, "paid"),
          core.listPledges(col.id),
          core.listPayouts(col.id),
        ]);
        return {
          ...base,
          contributions: paid.slice(0, 50).map((p) => ({
            name: p.displayName,
            amount: money(p.amountCents, p.currency),
            after_fees: money(p.netCents ?? p.amountCents, p.currency),
            via: core.paidVia(p),
            at: p.paidAt,
            message: p.message,
          })),
          open_pledges: plg.filter((p) => p.status === "open").map((p) => ({ name: p.displayName, amount: money(p.amountCents, col.currency), due: p.dueDate, reminded: Boolean(p.remindedAt), invoice: p.invoiceId })),
          payouts: pays.map((p) => ({ to: core.destinationLabel(p), withdrawn: money(p.amountCents, p.currency), received: money(p.netCents ?? p.amountCents, p.currency), status: p.status, note: p.note })),
        };
      }),
    }),

    create_payment_link: tool({
      description:
        "Create a secure payment link for the current user to contribute to a collection. Mobile money (M-Pesa, Airtel Money, Mixx by Yas, HaloPesa) is in TZS via Snippe; card or PayPal is in USD via PayPal. Default to mobile money for Tanzanian numbers. Always use this; never invent links.",
      inputSchema: z.object({
        code,
        amount: amount.describe("TZS for mobile_money (minimum 500), USD for card_or_paypal (minimum 1)"),
        method: z.enum(["mobile_money", "card_or_paypal"]).default("mobile_money"),
        display_name: z.string().max(80).optional().describe("Name shown to the organiser; defaults to the user's name"),
        message: z.string().max(280).optional().describe("Optional note to the organiser"),
      }),
      execute: safe(async (i) => {
        await refreshUser();
        const col = await mustFind(i.code);
        const provider = i.method === "card_or_paypal" ? "paypal" : "snippe";
        const ctb = await core.createContribution({
          collection: col,
          contributorId: ctx.user.id,
          displayName: i.display_name?.trim() || ctx.user.name || "Anonymous",
          amountCents: toCents(i.amount),
          source: ctx.channel,
          message: i.message,
          provider,
          payerPhone: provider === "snippe" && ctx.channel === "whatsapp" && ctx.user.phone.startsWith("255") ? ctx.user.phone : undefined,
        });
        return {
          pay_url: payUrl(ctb.id),
          amount: money(ctb.amountCents, ctb.currency),
          via: provider === "snippe" ? "mobile money (Snippe)" : "card or PayPal (PayPal)",
          note: "Share pay_url exactly. They pay exactly this amount; the organiser carries the fees. They'll get a receipt here once the payment is confirmed.",
        };
      }),
    }),

    make_pledge: tool({
      description: "Record a promise to pay later (pledge). The organiser is notified and can send reminders.",
      inputSchema: z.object({
        code,
        amount,
        due_date: date.optional(),
        display_name: z.string().max(80).optional().describe("Pledger's name if they gave it in this message; defaults to their saved name"),
      }),
      execute: safe(async (i) => {
        const col = await mustFind(i.code);
        await refreshUser(); // a parallel update_my_profile call may have just saved the name
        const p = await core.createPledge({
          collection: col,
          user: ctx.user,
          displayName: i.display_name?.trim() || ctx.user.name || "Anonymous",
          amountCents: toCents(i.amount),
          dueDate: i.due_date,
        });
        return { ok: true, pledge: money(p.amountCents, col.currency), due: p.dueDate };
      }),
    }),

    my_contributions: tool({
      description: "Show the current user's own contributions and pledges.",
      inputSchema: z.object({}),
      execute: safe(async () => {
        const db = await getDb();
        const rows = await db.select().from(schema.contributions).where(eq(schema.contributions.contributorId, ctx.user.id));
        const pl = await db.select().from(schema.pledges).where(eq(schema.pledges.userId, ctx.user.id));
        return {
          contributions: rows.map((r) => ({ amount: money(r.amountCents, r.currency), status: r.status, at: r.paidAt ?? r.createdAt })),
          pledges: pl.map((p) => ({ amount: money(p.amountCents), status: p.status, due: p.dueDate })),
        };
      }),
    }),

    remind_pledgers: tool({
      description: "Owner only: send each person with an open pledge a personal chat reminder with their own pay link.",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        mustOwn(col, ctx);
        return core.remindPledgers(col);
      }),
    }),

    send_pledge_invoice: tool({
      description:
        "Owner only: email a formal PayPal invoice (with QR code) to a pledger, via the PayPal Agent Toolkit. Needs the pledger's name as recorded and their email.",
      inputSchema: z.object({ code, pledger_name: z.string(), email: z.string().email() }),
      execute: safe(async (i) => {
        const col = await mustFind(i.code);
        mustOwn(col, ctx);
        const db = await getDb();
        const [p] = await db
          .select()
          .from(schema.pledges)
          .where(and(eq(schema.pledges.collectionId, col.id), eq(schema.pledges.status, "open"), ilike(schema.pledges.displayName, `%${i.pledger_name}%`)));
        if (!p) throw new ToolError(`No open pledge found for ${i.pledger_name}.`);
        if (col.currency === "TZS") throw new ToolError("PayPal invoices can't be issued in TZS. Use remind_pledgers instead (it sends a mobile money pay link).");
        const res = await createAndSendPledgeInvoice({
          invoiceNumber: `SP-${p.id.slice(-10).toUpperCase()}`,
          recipientEmail: i.email,
          recipientName: p.displayName,
          amountValue: (p.amountCents / 100).toFixed(2),
          currency: col.currency,
          collectionTitle: col.title,
          collectionCode: col.code,
          dueDate: p.dueDate,
        });
        await db.update(schema.pledges).set({ invoiceId: res.invoiceId }).where(eq(schema.pledges.id, p.id));
        return { ok: true, invoice_id: res.invoiceId, emailed_to: i.email, pay_link: res.payLink, has_qr: Boolean(res.qrBase64) };
      }),
    }),

    prepare_payout: tool({
      description:
        "Owner only: prepare a withdrawal from the collection balance. TZS money goes to mobile money (any Tanzanian number) or a Tanzanian bank via Snippe; USD money (from card/PayPal contributions) goes to a PayPal email. This does NOT move money: it sends the owner the amount, fees and a one-time CONFIRM code; money moves only when the owner replies with it.",
      inputSchema: z.object({
        code,
        method: z.enum(["mobile_money", "bank", "paypal"]),
        amount: amount.describe("Amount to withdraw from the balance: TZS for mobile_money/bank, USD for paypal"),
        recipient_name: z.string().min(2).max(80).describe("Name on the mobile money or bank account (required for mobile_money and bank)"),
        phone: z.string().optional().describe("mobile_money only: number like 0712345678"),
        bank: z.string().optional().describe("bank only: bank name or code, e.g. CRDB, NMB, NBC"),
        account_number: z.string().optional().describe("bank only"),
        paypal_email: z.string().email().optional().describe("paypal only"),
        purpose: z.string().max(300).describe("What the money is for; shown to contributors in the transparency update"),
      }),
      execute: safe(async (i) => {
        const col = await mustFind(i.code);
        mustOwn(col, ctx);
        let destination: core.PayoutDestination;
        if (i.method === "mobile_money") {
          if (!i.phone) throw new ToolError("Ask for the mobile money number to send to.");
          destination = { method: "mobile_money", phone: i.phone, name: i.recipient_name };
        } else if (i.method === "bank") {
          if (!i.bank || !i.account_number) throw new ToolError("Ask for the bank name and account number.");
          destination = { method: "bank", bank: i.bank, account: i.account_number, name: i.recipient_name };
        } else {
          if (!i.paypal_email) throw new ToolError("Ask for the PayPal email to send to.");
          destination = { method: "paypal", email: i.paypal_email, name: i.recipient_name };
        }
        const p = await core.proposePayout({ collection: col, requester: ctx.user, destination, amountCents: toCents(i.amount), note: i.purpose });
        const L = await langOf(ctx.user.phone);
        const cur = p.currency;
        const via = p.provider === "snippe" ? "Snippe" : "PayPal";
        const amt = money(p.amountCents, cur);
        const fees = `${money(p.quote.providerFeeCents, cur)} ${via} + ${money(p.quote.sarafuFeeCents, cur)} SarafuPay`;
        const net = money(p.quote.netCents, cur);
        const to = core.destinationLabel(p);
        await sendTo(
          ctx.user.phone,
          t(
            L,
            `🔐 *Thibitisha malipo*\nKutoa ${amt} kutoka *${col.code}* → ${to}\nAda: ${fees}\n*Atapokea: ${net}*\nKwa ajili ya: ${p.note}\n\nJibu *CONFIRM ${p.confirmCode}* kutuma kupitia ${via}, au *CANCEL ${p.confirmCode}*. Muda unaisha baada ya dakika 15.`,
            `🔐 *Confirm payout*\nWithdraw ${amt} from *${col.code}* → ${to}\nFees: ${fees}\n*They receive: ${net}*\nFor: ${p.note}\n\nReply *CONFIRM ${p.confirmCode}* to send it with ${via}, or *CANCEL ${p.confirmCode}*. Expires in 15 min.`,
          ),
        );
        return {
          ok: true,
          confirmation_message_already_sent: true,
          instruction: "Do NOT repeat the code. Briefly say you've sent the confirmation details above. Never say the money has moved.",
        };
      }),
    }),

    pricing: tool({
      description:
        "SarafuPay's current fees. Contributors pay exactly what they give; the organiser carries all fees. Use this whenever someone asks about charges.",
      inputSchema: z.object({}),
      execute: safe(async () => {
        const rates = await getRates();
        return {
          rule: "Contributors pay exactly what they give. Fees come out of the collection. The licensed provider (Snippe or PayPal) takes its fee and SarafuPay takes its percentage.",
          fees: RATE_KEYS.map((k) => ({ what: RATE_LABELS[k].title, via: RATE_LABELS[k].provider, total: rateSummary(rates[k], RATE_LABELS[k].currency) })),
          no_monthly_fee: true,
          no_minimum_withdrawal: true,
        };
      }),
    }),

    payout_history: tool({
      description: "List payouts made from a collection (anyone can see this — it's the transparency ledger).",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        const rows = await core.listPayouts(col.id);
        return rows
          .filter((r) => r.status !== "cancelled" && r.status !== "awaiting_confirmation")
          .map((r) => ({ to: r.recipientName ?? "recipient", amount: money(r.amountCents, r.currency), via: r.provider === "snippe" ? "Snippe" : "PayPal", purpose: r.note, status: r.status, at: r.executedAt }));
      }),
    }),

    get_share_message: tool({
      description: "Get the ready-to-forward invitation message for a collection (for WhatsApp groups).",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        const owner = await core.getUser(col.ownerId);
        return { share_message: shareMessage(col, owner?.name, await langOf(ctx.user.phone)), note: "Paste share_message verbatim." };
      }),
    }),

    get_dashboard_link: tool({
      description: "Owner only: private link to the treasurer dashboard (tables, charts, AI analyst).",
      inputSchema: z.object({ code }),
      execute: safe(async ({ code: c }) => {
        const col = await mustFind(c);
        mustOwn(col, ctx);
        return { dashboard: dashboardUrl(col), note: "Private link — tell the owner not to share it." };
      }),
    }),

    update_collection: tool({
      description: "Owner only: change title, purpose, target, deadline, payout email, or close/reopen a collection.",
      inputSchema: z.object({
        code,
        title: z.string().min(3).max(120).optional(),
        purpose: z.string().max(500).optional(),
        target_amount: amount.optional(),
        deadline: date.optional(),
        payout_paypal_email: z.string().email().optional(),
        status: z.enum(["active", "closed"]).optional(),
      }),
      execute: safe(async (i) => {
        const col = await mustFind(i.code);
        mustOwn(col, ctx);
        const updated = await core.updateCollection(col.id, {
          ...(i.title ? { title: i.title } : {}),
          ...(i.purpose ? { purpose: i.purpose } : {}),
          ...(i.target_amount ? { targetCents: toCents(i.target_amount) } : {}),
          ...(i.deadline ? { deadline: i.deadline } : {}),
          ...(i.payout_paypal_email ? { payoutEmail: i.payout_paypal_email } : {}),
          ...(i.status ? { status: i.status } : {}),
        });
        return { ok: true, code: updated?.code, status: updated?.status };
      }),
    }),
  };

  // Owners also get raw PayPal Agent Toolkit tools for invoice/order follow-up.
  if (paypalConfigured()) {
    Object.assign(tools, toolkitToolsForAgent(["get_invoice", "send_invoice_reminder", "generate_invoice_qr_code", "get_order"]));
  }
  return tools;
}
