import "server-only";
import { createHash, createPrivateKey, createPublicKey, sign, verify, type KeyObject } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { EvidenceCard } from "../db/schema";
import { env } from "../env";
import { newId } from "../format";
import type { ReceiptCrop } from "./receipt-vision";

/**
 * Evidence cards: a signed record of every Trust Copilot decision.
 *
 * Each card says what was claimed, which ledger rows each check compared it with, what the verdict
 * was, who decided (which model, or the organiser) and, for a photo, the SAM 3.1 crops of the
 * amount and reference with an independent read-back. Cards are chained per collection (each body
 * carries the previous card's hash) and the chain is signed with Ed25519, so editing or deleting a
 * card is detectable by anyone holding the public key.
 */

export type EvidenceCheck = {
  rule: "reference_unique" | "not_paid_through_sarafupay" | "photo_unique" | "currency" | "pledge" | "crop_readback";
  result: "pass" | "flag" | "info";
  detail: string;
  /** Ledger rows the check looked at (offline record, contribution and pledge ids). */
  compared: string[];
};

export type EvidenceBody = {
  v: 1;
  id: string;
  seq: number;
  prev: string | null;
  at: string;
  collection: string;
  record: string;
  action: "recorded" | "claimed" | "confirmed" | "rejected";
  claim: {
    payer: string;
    amount: number;
    currency: string;
    method: string;
    reference: string | null;
    received_on: string | null;
    evidence: string;
  };
  verdict: string;
  checks: EvidenceCheck[];
  photo_sha256: string | null;
  crops: Pick<ReceiptCrop, "field" | "url" | "box" | "boxBy" | "read" | "matches">[];
  decided_by: { kind: "agent"; model: string | null } | { kind: "organiser" } | { kind: "rules" };
  notes: string[];
};

const DEV_SEED = createHash("sha256").update("sarafupay-dev-evidence-key").digest();

let cached: { priv: KeyObject; pub: KeyObject; publicKey: string; dev: boolean } | null = null;
/** The signing key: EVIDENCE_SIGNING_KEY (32-byte seed, base64) or a fixed development key. */
export function signingKey() {
  const configured = env.evidenceSigningKey();
  if (cached && cached.dev === !configured) return cached;
  const seed = configured ? Buffer.from(configured, "base64") : DEV_SEED;
  if (seed.length !== 32) throw new Error("EVIDENCE_SIGNING_KEY must be 32 bytes, base64-encoded");
  // PKCS#8 wrapper for a raw Ed25519 seed.
  const priv = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]), format: "der", type: "pkcs8" });
  const pub = createPublicKey(priv);
  const raw = pub.export({ format: "der", type: "spki" }).subarray(-32);
  cached = { priv, pub, publicKey: Buffer.from(raw).toString("base64url"), dev: !configured };
  return cached;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Appends a card to the collection's chain. Retries when two cards race for the same position. */
export async function appendCard(input: Omit<EvidenceBody, "v" | "id" | "seq" | "prev" | "at">): Promise<EvidenceCard> {
  const db = await getDb();
  const key = signingKey();
  for (let attempt = 0; ; attempt++) {
    const [last] = await db
      .select({ seq: schema.evidenceCards.seq, hash: schema.evidenceCards.hash })
      .from(schema.evidenceCards)
      .where(eq(schema.evidenceCards.collectionId, input.collection))
      .orderBy(desc(schema.evidenceCards.seq))
      .limit(1);
    const body: EvidenceBody = { v: 1, id: newId("ev"), seq: (last?.seq ?? 0) + 1, prev: last?.hash ?? null, at: new Date().toISOString(), ...input };
    const text = JSON.stringify(body);
    const hash = sha256(text);
    const sig = sign(null, Buffer.from(hash, "hex"), key.priv).toString("base64url");
    try {
      const [card] = await db
        .insert(schema.evidenceCards)
        .values({ id: body.id, collectionId: input.collection, recordId: input.record, seq: body.seq, body: text, hash, sig })
        .returning();
      return card;
    } catch (e) {
      if (attempt < 3 && /evidence_chain_idx|unique|duplicate/i.test(String(e))) continue;
      throw e;
    }
  }
}

export type CardCheck = { hashOk: boolean; sigOk: boolean; linkOk: boolean };

/** Checks one card: its hash matches its body, the signature is valid, and it points at the card before it. */
export function checkCard(card: EvidenceCard, previous: EvidenceCard | undefined): CardCheck {
  const body = JSON.parse(card.body) as EvidenceBody;
  const hashOk = sha256(card.body) === card.hash;
  let sigOk = false;
  try {
    sigOk = verify(null, Buffer.from(card.hash, "hex"), signingKey().pub, Buffer.from(card.sig, "base64url"));
  } catch {
    sigOk = false;
  }
  const linkOk = card.seq === 1 ? body.prev === null : previous !== undefined && previous.seq === card.seq - 1 && body.prev === previous.hash;
  return { hashOk, sigOk, linkOk: linkOk && body.seq === card.seq };
}

export async function getCard(id: string) {
  if (!/^ev_[a-f0-9]{16}$/.test(id)) return null;
  const db = await getDb();
  const [card] = await db.select().from(schema.evidenceCards).where(eq(schema.evidenceCards.id, id));
  return card ?? null;
}

export async function chainFor(collectionId: string) {
  const db = await getDb();
  return db.select().from(schema.evidenceCards).where(eq(schema.evidenceCards.collectionId, collectionId)).orderBy(asc(schema.evidenceCards.seq));
}

/** Verifies a whole collection's chain: every card intact, signed and linked, with no gaps. */
export async function verifyChain(collectionId: string): Promise<{ ok: boolean; length: number; brokenAt: number | null }> {
  const cards = await chainFor(collectionId);
  for (const [i, card] of cards.entries()) {
    const c = checkCard(card, cards[i - 1]);
    if (card.seq !== i + 1 || !c.hashOk || !c.sigOk || !c.linkOk) return { ok: false, length: cards.length, brokenAt: card.seq };
  }
  return { ok: true, length: cards.length, brokenAt: null };
}

export const proofUrl = (id: string) => `${env.appUrl()}/proof/${id}`;

/** Every card about one payment record, oldest first: the agent's record, then the organiser's decision. */
export async function cardsForRecord(recordId: string) {
  const db = await getDb();
  return db.select().from(schema.evidenceCards).where(eq(schema.evidenceCards.recordId, recordId)).orderBy(asc(schema.evidenceCards.seq));
}
