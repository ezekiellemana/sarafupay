/**
 * Swahili voice evaluation: transcribes a folder of labelled voice notes with each Meta speech route
 * and reports word error rate (WER) per route and per speaker. Recordings stay outside the repo.
 * Run: npm run eval:voice -- <folder with labels.json>
 * labels.json: [{ "file": "NAME_text.ogg", "speaker": "NAME", "expected": "text" }]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listenOpen, SWAHILI_VOICE_CONTEXT, transcribeVoice } from "../lib/agent/meta-media";
import { wer } from "../lib/services/voice-eval";

type Label = { file: string; speaker: string; expected: string };
type Route = { name: string; run: (a: { data: Uint8Array; mimeType: string }) => Promise<string | null> };

const routes: Route[] = [
  { name: "Muse Voice Transcribe", run: (a) => transcribeVoice(a) },
  { name: "Muse Spark Open (plain)", run: (a) => listenOpen(a) },
  { name: "Muse Spark Open (+ context)", run: (a) => listenOpen(a, { context: SWAHILI_VOICE_CONTEXT }) },
  {
    name: "Muse Spark Open (+ context + Voice Transcribe draft)",
    run: async (a) => listenOpen(a, { context: SWAHILI_VOICE_CONTEXT, draft: await transcribeVoice(a).catch(() => null) }),
  },
];

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("usage: eval-voice <folder with labels.json>");
  const only = process.argv[3]; // optional route name filter
  const labels = JSON.parse(readFileSync(join(dir, "labels.json"), "utf8")) as Label[];
  const rows: { route: string; speaker: string; file: string; expected: string; got: string; wer: number }[] = [];
  for (const route of routes.filter((r) => !only || r.name.includes(only))) {
    for (const l of labels) {
      const audio = { data: new Uint8Array(readFileSync(join(dir, l.file))), mimeType: "audio/ogg" };
      let got = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          got = (await route.run(audio)) ?? "";
          break;
        } catch (e) {
          got = `[error: ${String(e).slice(0, 80)}]`;
        }
      }
      rows.push({ route: route.name, speaker: l.speaker, file: l.file, expected: l.expected, got, wer: wer(l.expected, got) });
      console.log(`${route.name} | ${l.speaker} | ${l.expected} -> ${got} (${(rows.at(-1)!.wer * 100).toFixed(0)}%)`);
    }
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const speakers = [...new Set(labels.map((l) => l.speaker))];
  const lines = [
    `| Route | WER (all ${labels.length} clips) | ${speakers.join(" | ")} |`,
    `|---|---|${speakers.map(() => "---").join("|")}|`,
    ...[...new Set(rows.map((r) => r.route))].map((name) => {
      const rs = rows.filter((r) => r.route === name);
      const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
      return `| ${name} | ${pct(avg(rs.map((r) => r.wer)))} | ${speakers.map((s) => pct(avg(rs.filter((r) => r.speaker === s).map((r) => r.wer)))).join(" | ")} |`;
    }),
  ];
  console.log("\n" + lines.join("\n"));
  writeFileSync(join(dir, "results.json"), JSON.stringify(rows, null, 1));
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
