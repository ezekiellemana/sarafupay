/**
 * What the fast path saves, measured on Muse Spark with the router's GOLD labels (so it needs no
 * Fireworks key): for each holdout message the router would send fast, run the first agent step
 * twice, full (every tool, normal effort) and fast (that intent's tools, fast effort), and compare
 * latency, input tokens and which tool the model reached for. Tools are not executed.
 * Run: npm run eval:fastpath [-- <limit>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { generateText, isStepCount, tool, type Tool } from "ai";
import { env } from "../lib/env";
import { buildTools } from "../lib/agent/tools";
import { systemPrompt } from "../lib/agent/prompt";
import { modelChain } from "../lib/agent/models";
import { fastPlan, type RouteDecision } from "../lib/agent/router";
import type { User } from "../lib/db/schema";

const user: User = { id: "u_eval", phone: "sim:255700000001", name: "Enzo", channel: "sim", paypalEmail: null, activeCollectionId: null, replyVoice: null, createdAt: new Date() };

async function main() {
  const limit = Number(process.argv[2] ?? 40);
  const rows = readFileSync("ml/router/data/holdout.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const real = buildTools({ user, channel: "sim" });
  // Same schemas, no execute: the model's choice is recorded, nothing touches the database.
  const tools: Record<string, Tool> = Object.fromEntries(
    Object.entries(real).map(([k, t]) => [k, tool({ description: t.description, inputSchema: t.inputSchema } as Parameters<typeof tool>[0])]),
  );
  const pick = modelChain()[0];
  if (!pick) throw new Error("No Meta model configured");
  const system = systemPrompt({ user, owned: [{ code: "NEEMA24", title: "Neema Wedding", progress: "TZS 1,200,000 of 2,000,000 (60%), 14 paid" }], active: null, channel: "sim", today: new Date().toISOString().slice(0, 10), lang: "sw" });
  const out: Record<string, unknown>[] = [];
  for (const r of rows) {
    if (out.length >= limit) break;
    const gold = JSON.parse(r.messages[2].content) as RouteDecision;
    const plan = fastPlan(gold, Object.keys(tools));
    if (!plan) continue;
    const text = r.messages[1].content as string;
    const runIt = async (fast: boolean) => {
      const t0 = Date.now();
      const opts = fast
        ? Object.fromEntries(Object.entries(pick.fast).map(([k, v]) => [k, { ...v, reasoningEffort: env.fastReasoningEffort() }]))
        : pick.fast;
      const res = await generateText({
        model: pick.model, system, messages: [{ role: "user", content: text }], tools,
        ...(fast ? { activeTools: plan.activeTools } : {}),
        stopWhen: isStepCount(1), maxOutputTokens: 1200, providerOptions: opts,
      });
      return { ms: Date.now() - t0, input: res.usage.inputTokens ?? 0, output: res.usage.outputTokens ?? 0, tool: res.toolCalls[0]?.toolName ?? "(text)" };
    };
    try {
      // Alternate which runs first so warm caches don't favour one side.
      const first = out.length % 2 === 0;
      const full = first ? await runIt(false) : undefined;
      const fast = await runIt(true);
      const fullR = full ?? (await runIt(false));
      out.push({ text, intent: gold.intent, full: fullR, fast });
      console.log(`${gold.intent.padEnd(18)} full ${String(fullR.ms).padStart(5)}ms ${fullR.input}tok ${fullR.tool.padEnd(20)} | fast ${String(fast.ms).padStart(5)}ms ${fast.input}tok ${fast.tool.padEnd(20)} | ${text.slice(0, 50)}`);
    } catch (e) {
      console.warn("skip", text, e instanceof Error ? e.message.slice(0, 120) : e);
    }
  }
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const sum = (k: "full" | "fast", f: "ms" | "input" | "output") => out.map((o) => (o[k] as Record<string, number>)[f]);
  const same = out.filter((o) => (o.full as { tool: string }).tool === (o.fast as { tool: string }).tool).length;
  const report = {
    model: `${pick.provider}:${pick.id}`, n: out.length, fast_effort: env.fastReasoningEffort(),
    full: { latency_p50_ms: med(sum("full", "ms")), input_tokens_mean: Math.round(sum("full", "input").reduce((a, b) => a + b, 0) / out.length) },
    fast: { latency_p50_ms: med(sum("fast", "ms")), input_tokens_mean: Math.round(sum("fast", "input").reduce((a, b) => a + b, 0) / out.length) },
    same_first_action: `${same}/${out.length}`,
  };
  console.log(JSON.stringify(report, null, 1));
  writeFileSync("ml/router/data/fastpath_report.json", JSON.stringify({ report, rows: out }, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
