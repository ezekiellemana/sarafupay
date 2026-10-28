import "server-only";
import { generateText, type LanguageModel } from "ai";
import { withModelFallback, type ModelPick } from "./models";
import type { ToolStep } from "../services/agent-log";

/**
 * Verification layer for the organiser copilot, outside the agent's control.
 *
 * When a reply explains payments found by investigate_payments, it is checked before the organiser
 * sees it:
 * 1. Code: every amount and date in the reply must appear in what the investigation found, and
 *    every person the investigation looked at must be in the reply (nobody silently left out).
 * 2. Muse Spark: each claim in the reply must be supported by the investigation's facts.
 * A reply that fails is rewritten from the facts with the problems as feedback and checked again,
 * up to twice. If it still fails, the original is sent with a warning, so the organiser is never
 * told an unchecked story as fact.
 */

export type ClaimCheck = {
  verdict: "verified" | "corrected" | "flagged" | "unchecked";
  problems: string[];
  reply: string;
};

let checkerOverride: LanguageModel | undefined;
export function __setClaimCheckerForTests(m: LanguageModel | undefined) {
  checkerOverride = m;
}

/** Amounts (TZS 50,000 · $25 · 50000) and dates (2026-10-25) as bare digit strings. */
export function figures(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\d{4}-\d{2}-\d{2}/g)) out.add(m[0]);
  const rest = text.replace(/\d{4}-\d{2}-\d{2}/g, " ");
  for (const m of rest.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?/g)) out.add(m[0].replace(/,/g, "").replace(/\.0+$/, ""));
  return [...out];
}

/** Figures in the reply that the facts never mention. */
export function unknownFigures(reply: string, facts: string): string[] {
  const known = new Set(figures(facts));
  for (const d of facts.matchAll(/(\d{4})-\d{2}-\d{2}/g)) known.add(d[1]); // "2026" on its own
  return figures(reply).filter((f) => !known.has(f));
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** People the investigation looked at whom the reply never mentions (by first name). */
export function missingPeople(reply: string, facts: string): string[] {
  let names: string[] = [];
  try {
    const found = JSON.parse(facts) as { cases?: { name?: string }[] }[];
    names = found.flatMap((f) => (f.cases ?? []).map((c) => c.name ?? "")).filter(Boolean);
  } catch {
    return [];
  }
  const text = fold(reply);
  return [...new Set(names)].filter((n) => {
    const first = fold(n).split(/\s+/)[0];
    return first && !text.includes(first);
  });
}

/** The investigation results this turn, or null when the reply needs no check. */
export function investigationFacts(steps: ToolStep[]): string | null {
  const found = steps.filter((s) => s.toolName === "investigate_payments" && s.output && typeof s.output === "object" && "cases" in (s.output as object));
  return found.length ? JSON.stringify(found.map((s) => s.output)) : null;
}

const CHECK = `You check a WhatsApp reply that an assistant wrote to a group-collection organiser, against the FACTS its payment investigation found.
For each statement in the reply about a person, a payment, an amount, a date, a status or a reason, decide whether the FACTS support it as written. A statement that goes beyond the facts (an invented reason, a wrong amount, "paid" when the facts say pending, a person not in the facts) is unsupported. Questions, greetings, offers and reminder drafts copied from the facts are fine.

FACTS:
{facts}

REPLY:
{reply}

Answer only with JSON: {"unsupported": [{"claim": "<the statement>", "reason": "one sentence"}]} (an empty list when everything is supported).`;

const FIX = `Rewrite this WhatsApp reply to a group-collection organiser so that every statement is supported by the FACTS. Keep its language, tone, length and any reminder drafts (copied word for word from the facts' previews), and the question asking whether to send them. Remove or correct these problems:
{problems}

FACTS:
{facts}

REPLY:
{reply}

Answer with the corrected reply only.`;

async function ask(prompt: string): Promise<string> {
  // Muse Spark reasons before answering; leave room for that, at low effort.
  const call = (model: LanguageModel, fast?: ModelPick["fast"]) =>
    generateText({ model, prompt, maxOutputTokens: 4000, maxRetries: 1, ...(fast ? { providerOptions: fast } : {}) }).then((r) => r.text.trim());
  return checkerOverride ? call(checkerOverride) : withModelFallback((pick) => call(pick.model, pick.fast));
}

function parseUnsupported(text: string): string[] | null {
  const json = /\{[\s\S]*\}/.exec(text)?.[0];
  if (!json) return null;
  try {
    const list = (JSON.parse(json) as { unsupported?: { claim?: string; reason?: string }[] }).unsupported;
    return Array.isArray(list) ? list.map((u) => `"${u.claim ?? "?"}": ${u.reason ?? "not in the facts"}`) : null;
  } catch {
    return null;
  }
}

async function problemsIn(reply: string, facts: string): Promise<{ problems: string[]; modelChecked: boolean }> {
  const problems = [
    ...unknownFigures(reply, facts).map((f) => `"${f}" is not an amount or date the investigation found`),
    ...missingPeople(reply, facts).map((n) => `${n} was investigated but the reply leaves them out`),
  ];
  let modelChecked = false;
  try {
    const raw = await ask(CHECK.replace("{facts}", facts).replace("{reply}", reply));
    const found = parseUnsupported(raw);
    if (!found) console.warn("[verify-claims] unreadable check:", raw.slice(0, 300));
    if (found) {
      modelChecked = true;
      problems.push(...found);
    }
  } catch (e) {
    console.warn("[verify-claims] check failed", e);
  }
  return { problems, modelChecked };
}

export async function checkReply(reply: string, facts: string, lang: "sw" | "en"): Promise<ClaimCheck> {
  const first = await problemsIn(reply, facts);
  if (!first.problems.length) return { verdict: first.modelChecked ? "verified" : "unchecked", problems: [], reply };
  // Each rewrite gets the problems the last check found, so it can fix exactly those.
  let draft = reply;
  let problems = first.problems;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fixed = await ask(FIX.replace("{problems}", problems.map((p) => `- ${p}`).join("\n")).replace("{facts}", facts).replace("{reply}", draft));
      if (!fixed) break;
      const again = await problemsIn(fixed, facts);
      if (!again.problems.length) return { verdict: "corrected", problems: first.problems, reply: fixed };
      [draft, problems] = [fixed, again.problems];
    } catch (e) {
      console.warn("[verify-claims] rewrite failed", e);
      break;
    }
  }
  const note =
    lang === "sw"
      ? "\n\n⚠️ Sikuweza kuthibitisha kila kitu hapa juu dhidi ya kumbukumbu za malipo. Kabla ya kuchukua hatua, fungua dashibodi."
      : "\n\n⚠️ I couldn't verify everything above against the payment records. Check the dashboard before acting on it.";
  return { verdict: "flagged", problems: first.problems, reply: reply + note };
}
