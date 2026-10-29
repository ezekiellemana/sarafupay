"use client";

/**
 * "Ask the Treasurer": a slide-over chat on the dashboard. Questions go to /api/dashboard/ask,
 * where a Meta model answers from this collection's live numbers. It only reads; it can't move
 * money or message anyone.
 */

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const STARTERS = [
  { label: "Who hasn't paid?", prompt: "Which pledges are still open, and how much is outstanding in total?" },
  { label: "Will we hit the target?", prompt: "At the current pace, will we reach the target before the deadline? Show the numbers." },
  { label: "Transparency update", prompt: "Draft a short WhatsApp transparency update for the group with totals and payouts." },
  { label: "Biggest day", prompt: "Which day brought in the most money, and from whom?" },
];

export function TreasurerChat({ headers }: { headers: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ messages: next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) }),
      });
      const r = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      setMsgs((m) => [...m, r.text ? { role: "assistant", content: r.text } : { role: "assistant", content: r.error ?? "Something went wrong.", error: true }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Could not reach the Treasurer. Check your connection.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-forest px-4 py-3 sm:bottom-6 sm:right-6 sm:px-5 text-sm font-semibold text-paper shadow-lg shadow-forest/30 transition hover:bg-forest-2 ${open ? "pointer-events-none opacity-0" : ""}`}
      >
        <span aria-hidden>✨</span>
        <span className="sm:hidden">Ask</span>
        <span className="hidden sm:inline">Ask the Treasurer</span>
      </button>
      <div className={`fixed inset-0 z-40 bg-ink/20 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask the Treasurer"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-[#fffaf0] shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-paper" aria-hidden>
            ✨
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold leading-tight">Treasurer</p>
            <p className="text-xs text-ink-soft">Answers from your live numbers · Meta AI</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full px-2 py-1 text-xl text-ink-soft hover:bg-paper-2" aria-label="Close">
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-soft">Ask anything about this collection, in English or Kiswahili. Try:</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button key={s.label} type="button" onClick={() => ask(s.prompt)} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-forest">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "rounded-br-md bg-forest text-paper" : m.error ? "rounded-bl-md bg-terracotta/10 text-terracotta" : "rounded-bl-md bg-white text-ink ring-1 ring-[#eadfc8]"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {busy ? <p className="animate-pulse text-sm text-ink-soft">Checking the books…</p> : null}
          <div ref={end} />
        </div>
        <form
          className="flex items-end gap-2 border-t border-line px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <textarea
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(text);
              }
            }}
            rows={1}
            placeholder="Ask the Treasurer…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest"
          />
          <button type="submit" disabled={busy || !text.trim()} className="h-10 rounded-full bg-forest px-4 text-sm font-semibold text-paper disabled:opacity-40">
            Ask
          </button>
        </form>
      </aside>
    </>
  );
}
