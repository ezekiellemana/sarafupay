import { pgTable, text, bigint, timestamp, serial, index } from "drizzle-orm/pg-core";

// Money is stored as amount × 100 for every currency. bigint, because TZS totals pass the
// 32-bit limit quickly (TZS 21.5M = 2.15 billion "cents").
const cents = (name: string) => bigint(name, { mode: "number" });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  // E.164 digits for WhatsApp users, "sim:<digits>" for simulator users.
  phone: text("phone").notNull().unique(),
  name: text("name"),
  channel: text("channel").notNull(), // 'whatsapp' | 'sim'
  paypalEmail: text("paypal_email"),
  activeCollectionId: text("active_collection_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose"),
  category: text("category").notNull().default("other"),
  targetCents: cents("target_cents").notNull(),
  // Main currency of the target and of mobile money contributions. Card/PayPal money is kept in USD
  // alongside it (two rails, never converted automatically).
  currency: text("currency").notNull().default("TZS"),
  deadline: text("deadline"), // YYYY-MM-DD
  payoutEmail: text("payout_email"),
  status: text("status").notNull().default("active"), // active | closed
  ownerKey: text("owner_key").notNull(),
  // Treasurer autopilot (lib/services/autopilot.ts): "on" | "off", and when it last spoke.
  autopilot: text("autopilot").notNull().default("off"),
  autopilotReportAt: timestamp("autopilot_report_at", { withTimezone: true }),
  autopilotDeadlineAt: timestamp("autopilot_deadline_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contributions = pgTable(
  "contributions",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id").notNull(),
    contributorId: text("contributor_id"),
    displayName: text("display_name").notNull(),
    amountCents: cents("amount_cents").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("pending"), // pending | paid | failed | refunded
    source: text("source").notNull(), // whatsapp | sim | web
    message: text("message"),
    // Which rail took the money: "snippe" (mobile money, TZS) or "paypal" (card/PayPal, USD).
    provider: text("provider").notNull().default("paypal"),
    providerRef: text("provider_ref"), // Snippe session/payment reference
    paypalOrderId: text("paypal_order_id"),
    paypalCaptureId: text("paypal_capture_id"),
    payerEmail: text("payer_email"),
    payerPhone: text("payer_phone"),
    // Fees, fixed at settlement (see lib/pricing.ts). net = amount − provider fee − SarafuPay fee.
    providerFeeCents: cents("provider_fee_cents"),
    sarafuFeeCents: cents("sarafu_fee_cents"),
    netCents: cents("net_cents"),
    rateJson: text("rate_json"),
    // What the payer actually paid, in their own currency (e.g. EUR 20.00 by card), when it differs
    // from the settlement currency in amount_cents/currency (USD for PayPal). fx_rate as PayPal reports it.
    payCurrency: text("pay_currency"),
    payAmountCents: cents("pay_amount_cents"),
    fxRate: text("fx_rate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("contrib_collection_idx").on(t.collectionId), index("contrib_order_idx").on(t.paypalOrderId)],
);

export const pledges = pgTable("pledges", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id").notNull(),
  userId: text("user_id"),
  displayName: text("display_name").notNull(),
  amountCents: cents("amount_cents").notNull(),
  dueDate: text("due_date"),
  status: text("status").notNull().default("open"), // open | fulfilled | cancelled
  invoiceId: text("invoice_id"),
  remindedAt: timestamp("reminded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id").notNull(),
  requestedBy: text("requested_by").notNull(),
  // "mobile_money" | "bank" (Snippe, TZS) | "paypal" (PayPal Payouts, USD)
  method: text("method").notNull().default("paypal"),
  provider: text("provider").notNull().default("paypal"),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  recipientBank: text("recipient_bank"),
  recipientAccount: text("recipient_account"),
  recipientName: text("recipient_name"),
  // Withdrawn from the collection balance. The organiser receives net_cents.
  amountCents: cents("amount_cents").notNull(),
  providerFeeCents: cents("provider_fee_cents"),
  sarafuFeeCents: cents("sarafu_fee_cents"),
  netCents: cents("net_cents"),
  rateJson: text("rate_json"),
  providerRef: text("provider_ref"), // Snippe payout reference
  currency: text("currency").notNull(),
  note: text("note"),
  // awaiting_confirmation | processing | success | failed | cancelled
  status: text("status").notNull().default("awaiting_confirmation"),
  confirmCode: text("confirm_code").notNull(),
  paypalBatchId: text("paypal_batch_id"),
  paypalItemId: text("paypal_item_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  executedAt: timestamp("executed_at", { withTimezone: true }),
});

// Money the organiser received outside SarafuPay (cash, someone's own M-Pesa, a bank deposit),
// usually logged from a receipt photo or a voice note. Kept apart from `contributions`: SarafuPay
// never held this money, so it is reported for transparency but never counts towards a payout.
export const offlineRecords = pgTable(
  "offline_records",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id").notNull(),
    recordedBy: text("recorded_by").notNull(), // user id (owner, or a contributor's claim)
    displayName: text("display_name").notNull(),
    amountCents: cents("amount_cents").notNull(),
    currency: text("currency").notNull(),
    method: text("method").notNull(), // cash | mobile_money | bank | other
    reference: text("reference"), // transaction id printed on the receipt
    receivedOn: text("received_on"), // YYYY-MM-DD
    evidence: text("evidence").notNull(), // photo | voice | text
    imageHash: text("image_hash"), // sha256 of the receipt photo, to catch the same photo twice
    // confirmed (owner) | claimed (contributor, awaiting owner) | rejected
    status: text("status").notNull().default("confirmed"),
    // Trust checks: ok | duplicate | mismatch | review
    checkStatus: text("check_status").notNull().default("ok"),
    checkNote: text("check_note"),
    pledgeId: text("pledge_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("offline_collection_idx").on(t.collectionId)],
);

// Small generated images (collection share cards), served at /api/media/<id>.
export const media = pgTable("media", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id"),
  mimeType: text("mime_type").notNull(),
  dataB64: text("data_b64").notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Every message in and out of the bot, per phone. Doubles as agent memory and simulator inbox.
export const chatLog = pgTable(
  "chat_log",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    direction: text("direction").notNull(), // in | out
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_phone_idx").on(t.phone, t.id)],
);

// WhatsApp message ids we already handled. Meta retries webhooks (e.g. while the
// server cold-starts), so every inbound id is claimed exactly once.
export const processedMessages = pgTable("processed_messages", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Admin-editable configuration (pricing rates, ...). value is JSON.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Provider webhook events already handled (Snippe retries and may deliver twice).
export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
export type Pledge = typeof pledges.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type OfflineRecord = typeof offlineRecords.$inferSelect;
