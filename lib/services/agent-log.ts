import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

/** Masks phone and account numbers (runs of 7+ digits) but keeps amounts readable. */
export function mask(text: string): string {
  return text.replace(/\d{7,}/g, (d) => `${d.slice(0, 3)}…${d.slice(-2)}`);
}

export type ToolStep = { toolName: string; input: unknown; output?: unknown };

/** Short human summary of a tool result: its error, or its most telling fields. */
function summarise(output: unknown): { ok: boolean; text: string } {
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.error === "string") return { ok: false, text: o.error };
    for (const k of ["summary", "result"]) if (typeof o[k] === "string") return { ok: true, text: o[k] as string };
    const keys = ["status", "autopilot", "check", "code", "progress", "reminded", "unreachable", "report_sent", "url", "note"];
    const picked = keys.filter((k) => o[k] !== undefined).map((k) => `${k}: ${typeof o[k] === "string" ? o[k] : JSON.stringify(o[k])}`);
    return { ok: true, text: picked.join(" · ") || "ok" };
  }
  return { ok: true, text: output === undefined ? "ok" : String(output) };
}

export async function logToolSteps(phone: string, model: string | null, steps: ToolStep[]): Promise<void> {
  if (!steps.length) return;
  const db = await getDb();
  await db.insert(schema.agentActions).values(
    steps.map((s) => {
      const input = (s.input ?? {}) as Record<string, unknown>;
      const r = summarise(s.output);
      return {
        phone,
        collectionCode: typeof input.code === "string" ? input.code.toUpperCase() : null,
        tool: s.toolName,
        input: mask(JSON.stringify(input)).slice(0, 600),
        ok: r.ok ? "yes" : "no",
        result: mask(r.text).slice(0, 600),
        model,
      };
    }),
  );
}

export async function actionsFor(code: string, limit = 40) {
  const db = await getDb();
  return db
    .select()
    .from(schema.agentActions)
    .where(eq(schema.agentActions.collectionCode, code.toUpperCase()))
    .orderBy(desc(schema.agentActions.id))
    .limit(limit);
}
