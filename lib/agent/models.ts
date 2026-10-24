import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { env } from "../env";

/** Errors worth trying the next model for: overloaded, rate limited, retired/unknown model. */
export function isRetryableModelError(e: unknown): boolean {
  const text = JSON.stringify(e, Object.getOwnPropertyNames(e as object)) + String(e);
  return /\b(5\d\d|429|404)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|NOT_FOUND|high demand|overloaded|no longer available|model_not_found|fetch failed|ECONNRESET|ETIMEDOUT/i.test(text);
}

export type ModelPick = {
  provider: "meta" | "gemini";
  id: string;
  model: LanguageModel;
  /** Provider options for a fast, low-reasoning chat turn. */
  fast: Record<string, Record<string, string | number | boolean | Record<string, string>>>;
  /** Whether this model accepts audio file parts directly (Gemini). Meta voice goes through transcription. */
  audioIn: boolean;
};

/** The Meta Model API, through its OpenAI-compatible Chat Completions endpoint. */
export function metaProvider() {
  return createOpenAICompatible({
    name: "meta",
    baseURL: env.metaBaseUrl(),
    apiKey: env.metaApiKey(),
    supportsStructuredOutputs: true,
  });
}

/**
 * Every configured chat model, best first: Meta's Muse Spark models, then Gemini as a fallback
 * so the bot keeps answering if the Meta API is down or the key is missing.
 */
export function modelChain(): ModelPick[] {
  const out: ModelPick[] = [];
  if (env.metaApiKey()) {
    const meta = metaProvider();
    for (const id of env.metaModels()) {
      out.push({ provider: "meta", id, model: meta.chatModel(id), fast: { meta: { reasoningEffort: env.metaReasoningEffort() } }, audioIn: false });
    }
  }
  if (env.geminiApiKey()) {
    const google = createGoogleGenerativeAI({ apiKey: env.geminiApiKey() });
    for (const id of env.geminiModels()) {
      out.push({ provider: "gemini", id, model: google(id), fast: { google: { thinkingConfig: { thinkingLevel: "low" } } }, audioIn: true });
    }
  }
  return out;
}

/** Name of the model that answers first, for health checks and the admin page. */
export function primaryModel(): string | null {
  const first = modelChain()[0];
  return first ? `${first.provider}:${first.id}` : null;
}

/**
 * Runs `fn` with each configured model in turn until one succeeds. Non-retryable errors (bad
 * request, auth) stop the chain, except that a Meta failure always falls through to Gemini.
 */
export async function withModelFallback<T>(fn: (pick: ModelPick) => Promise<T>, filter?: (p: ModelPick) => boolean): Promise<T> {
  const chain = modelChain().filter((p) => (filter ? filter(p) : true));
  if (!chain.length) throw new Error("No AI model configured");
  let last: unknown;
  for (let i = 0; i < chain.length; i++) {
    const pick = chain[i];
    try {
      return await fn(pick);
    } catch (e) {
      last = e;
      const nextIsOtherProvider = chain[i + 1] && chain[i + 1].provider !== pick.provider;
      if (!isRetryableModelError(e) && !nextIsOtherProvider) throw e;
      console.warn(`[ai] ${pick.provider}:${pick.id} failed, trying next model`, e instanceof Error ? e.message : e);
    }
  }
  throw last;
}

/** Back-compat for callers that only ever used Gemini (AG Studio adapter). */
export async function withGeminiFallback<T>(fn: (model: LanguageModel, id: string) => Promise<T>): Promise<T> {
  return withModelFallback((p) => fn(p.model, p.id), (p) => p.provider === "gemini");
}
