"use client";

/**
 * Pledge scoreboard.
 *
 * Shows who promised what as a friendly scoreboard rather than a collections report:
 * kept promises, what is still to come, who is overdue, and a "send friendly nudges"
 * button that reuses SarafuPay's WhatsApp reminder flow (with an inline confirm step).
 * The nudge reaches everyone with an open pledge, so the widget never filters itself.
 */

import { useState } from "react";
import type { Fmt } from "./charts";

export type NudgeResult = { ok: boolean; reminded?: string[]; error?: string };
export type PledgeRow = { pledger: string; amount: number; due: string; status: string; reminded: string };

type Row = { person: string; amount: number; status: string; due: Date | null; reminded: boolean };

const INK = "#12261e";
const MUTED = "#5b6b62";
const FOREST = "#0e3b2c";
const GOLD = "#c98a0e";
const LINE = "#eadfc8";
const AVATAR = ["#0e3b2c", "#c98a0e", "#c4502f", "#2a6f97", "#5c7d60", "#9c6b3d"];

const DAY = 86_400_000;

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" && v) {
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function hue(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}

/** Friendly wording, never "debt" or "owes". */
function whenText(r: Row, today: Date) {
  if (r.status === "fulfilled") return "Promise kept";
  if (r.status === "cancelled") return "Cancelled";
  if (!r.due) return r.reminded ? "Open · nudged" : "Open, no date set";
  const days = Math.round((r.due.getTime() - today.getTime()) / DAY);
  const nudged = r.reminded ? " · nudged" : "";
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} past the date${nudged}`;
  if (days === 0) return `Due today${nudged}`;
  if (days === 1) return `Due tomorrow${nudged}`;
  return `Due ${r.due.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${nudged}`;
}

function rank(r: Row, today: Date) {
  if (r.status === "fulfilled") return 3;
  if (r.status === "cancelled") return 4;
  if (r.due && r.due.getTime() < today.getTime()) return 0;
  return r.due ? 1 : 2;
}

export function PledgeScoreboard({ pledges, fmt, onNudge }: { pledges: PledgeRow[]; fmt: Fmt; onNudge?: () => Promise<NudgeResult> }) {
  const [nudge, setNudge] = useState<"idle" | "confirm" | "sending" | "done" | "error">("idle");
  const [nudgeMsg, setNudgeMsg] = useState("");
  const rows: Row[] = pledges.map((p) => ({
    person: p.pledger || "Someone",
    amount: p.amount,
    status: p.status.toLowerCase(),
    due: toDate(p.due),
    reminded: p.reminded === "yes",
  }));
  if (!rows.length) return <p className="grid min-h-32 place-items-center text-center text-sm text-ink-soft">No pledges yet. When someone promises to pay later, they show up here.</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const live = rows.filter((r) => r.status !== "cancelled");
  const kept = live.filter((r) => r.status === "fulfilled");
  const open = live.filter((r) => r.status === "open");
  const total = live.reduce((s, r) => s + r.amount, 0);
  const keptSum = kept.reduce((s, r) => s + r.amount, 0);
  const openSum = open.reduce((s, r) => s + r.amount, 0);
  const pct = total > 0 ? Math.round((keptSum / total) * 100) : 0;
  const late = open.filter((r) => r.due && r.due.getTime() < today.getTime()).length;
  const waiting = rows.filter((r) => r.status === "open");
  const sorted = [...waiting].sort((a, b) => rank(a, today) - rank(b, today) || (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0) || b.amount - a.amount);

  const sendNudges = async () => {
    if (!onNudge) return;
    setNudge("sending");
    try {
      const r = await onNudge();
      if (r.ok) {
        setNudge("done");
        setNudgeMsg(r.reminded?.length ? `Nudged ${r.reminded.join(", ")} on WhatsApp.` : "Nobody needed a nudge.");
      } else {
        setNudge("error");
        setNudgeMsg(r.error ?? "Could not send reminders.");
      }
    } catch {
      setNudge("error");
      setNudgeMsg("Could not send reminders.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: 480, color: INK, fontSize: 13, minHeight: 0 }}>
      <div style={{ padding: "2px 2px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {kept.length} of {live.length} promise{live.length === 1 ? "" : "s"} kept
          </div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            {fmt(openSum)} still to come{late ? ` · ${late} past the date` : ""}
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of pledged money already paid"
          style={{ marginTop: 8, height: 10, borderRadius: 999, background: "#f3ead6", overflow: "hidden" }}
        >
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${FOREST}, #2f7a5a)`, transition: "width .4s" }} />
        </div>
        <div style={{ marginTop: 4, color: MUTED, fontSize: 11 }}>
          {fmt(keptSum)} of {fmt(total)} pledged has arrived ({pct}%)
        </div>
        {kept.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }} aria-label="Promises kept">
            {kept.map((r, i) => (
              <span
                key={`kept-${r.person}-${i}`}
                style={{
                  background: "#dff1e7",
                  color: "#0e5a3a",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ✓ {r.person} · {fmt(r.amount)}
              </span>
            ))}
          </div>
        )}
      </div>

      {sorted.length === 0 && (
        <div style={{ padding: "14px 2px", color: FOREST, fontWeight: 600, borderTop: `1px solid ${LINE}` }}>Every promise is kept. Asante sana!</div>
      )}
      <ol style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1, minHeight: 0, borderTop: sorted.length ? `1px solid ${LINE}` : "none" }}>
        {sorted.map((r, i) => {
          const isKept = r.status === "fulfilled";
          const isLate = r.status === "open" && r.due && r.due.getTime() < today.getTime();
          return (
            <li key={`${r.person}-${i}`}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "6px 4px",
                  borderBottom: `1px solid ${LINE}`,
                  opacity: r.status === "cancelled" ? 0.5 : 1,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flex: "none",
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    background: hue(r.person),
                  }}
                >
                  {initials(r.person)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.person}</span>
                  <span style={{ display: "block", fontSize: 11, color: isLate ? "#9c3d22" : MUTED }}>{whenText(r, today)}</span>
                </span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontWeight: 700, color: isKept ? FOREST : INK }}>{fmt(r.amount)}</span>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 2,
                      padding: "1px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      background: isKept ? "#dff1e7" : isLate ? "#f8e1da" : r.status === "cancelled" ? "#eee9e0" : "#fdf0d5",
                      color: isKept ? "#0e5a3a" : isLate ? "#9c3d22" : r.status === "cancelled" ? MUTED : "#8a5a00",
                    }}
                  >
                    {isKept ? "Kept ✓" : r.status === "cancelled" ? "Cancelled" : "Open"}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {onNudge && open.length > 0 && (
        <div style={{ paddingTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {nudge === "idle" && (
            <button type="button" onClick={() => setNudge("confirm")} style={btn(GOLD)}>
              Send friendly nudges ({open.length})
            </button>
          )}
          {nudge === "confirm" && (
            <>
              <span style={{ fontSize: 12 }} title="Each person gets a WhatsApp reminder with their own pay link">
                Nudge {open.length} {open.length === 1 ? "person" : "people"} on WhatsApp?
              </span>
              <button type="button" onClick={sendNudges} style={btn(FOREST)}>
                Send
              </button>
              <button type="button" onClick={() => setNudge("idle")} style={btn("transparent", MUTED)}>
                Cancel
              </button>
            </>
          )}
          {nudge === "sending" && <span style={{ fontSize: 12, color: MUTED }}>Sending…</span>}
          {(nudge === "done" || nudge === "error") && (
            <span style={{ fontSize: 12, color: nudge === "done" ? FOREST : "#9c3d22" }}>{nudgeMsg}</span>
          )}
        </div>
      )}
    </div>
  );
}

function btn(bg: string, fg = "#fff"): React.CSSProperties {
  return {
    border: bg === "transparent" ? `1px solid ${LINE}` : "none",
    background: bg,
    color: fg,
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}
