"use client";

/**
 * A plain, sortable, searchable table for the dashboard's ledgers, with a total row and a CSV
 * download, so an organiser can hand the numbers to their group or their accountant.
 */

import { useMemo, useState } from "react";
import type { Fmt } from "./charts";

export type Column<R> = {
  key: keyof R & string;
  label: string;
  kind?: "text" | "money" | "date" | "pill";
  /** Hide on small screens. */
  wide?: boolean;
};

const PILL: Record<string, string> = {
  paid: "bg-[#dff1e7] text-[#0e5a3a]",
  success: "bg-[#dff1e7] text-[#0e5a3a]",
  fulfilled: "bg-[#dff1e7] text-[#0e5a3a]",
  processing: "bg-[#e3eef6] text-[#1f5575]",
  pending: "bg-[#e3eef6] text-[#1f5575]",
  failed: "bg-[#f8e1da] text-[#9c3d22]",
  unclaimed: "bg-[#f8e1da] text-[#9c3d22]",
  whatsapp: "bg-[#dcf5e3] text-[#0b6b3a]",
  chat: "bg-[#e6efe9] text-forest",
  web: "bg-[#fdf0d5] text-[#8a5a00]",
};

export function Pill({ value }: { value: string }) {
  if (!value) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PILL[value.toLowerCase()] ?? "bg-[#eee9e0] text-ink"}`}>
      {value === "whatsapp" ? "WhatsApp" : value}
    </span>
  );
}

function shortDate(d: string) {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Ledger<R extends Record<string, string | number>>({
  rows,
  columns,
  fmt,
  filename,
  empty,
  defaultSort,
}: {
  rows: R[];
  columns: Column<R>[];
  fmt: Fmt;
  filename: string;
  empty: string;
  defaultSort: { key: keyof R & string; dir: "asc" | "desc" };
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [all, setAll] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = needle ? rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(needle))) : rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...hit].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [rows, columns, q, sort]);

  const moneyCols = columns.filter((c) => c.kind === "money");
  // Phones get a list instead of a table: name and amount, with date, status and note beneath.
  const titleCol = columns[0];
  const amountCol = moneyCols[0];
  const dateCol = columns.find((c) => c.kind === "date");
  const pillCol = columns.find((c) => c.kind === "pill");
  const noteCol = columns.find((c, i) => i > 0 && c.kind === "text" && !c.key.endsWith("_ref"));
  const PHONE_ROWS = 6;
  const phoneRows = all ? shown : shown.slice(0, PHONE_ROWS);
  const totals = Object.fromEntries(moneyCols.map((c) => [c.key, shown.reduce((s, r) => s + Number(r[c.key] ?? 0), 0)]));

  const download = () => {
    const lines = [columns.map((c) => csvCell(c.label)).join(","), ...shown.map((r) => columns.map((c) => csvCell(r[c.key])).join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (key: keyof R & string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: columns.find((c) => c.key === key)?.kind === "text" ? "asc" : "desc" }));

  return (
    <div className="flex min-h-0 flex-col">
      {rows.length > 5 ? (
      <div className="mb-3 flex items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search this table"
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-forest"
        />
        <button
          type="button"
          onClick={download}
          disabled={!shown.length}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-2 disabled:opacity-40"
        >
          ⬇ CSV
        </button>
      </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="grid min-h-24 place-items-center text-center text-sm text-ink-soft">{empty}</p>
      ) : (
        <>
        <ul className="divide-y divide-[#eadfc8] md:hidden">
          {phoneRows.map((r, i) => (
            <li key={i} className="flex items-start gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r[titleCol.key]}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
                  {dateCol ? <span>{shortDate(String(r[dateCol.key]))}</span> : null}
                  {pillCol ? <Pill value={String(r[pillCol.key])} /> : null}
                </span>
                {noteCol && r[noteCol.key] ? (
                  <span className="mt-1 block truncate text-xs text-ink-soft">{noteCol.key === "message" ? `“${r[noteCol.key]}”` : r[noteCol.key]}</span>
                ) : null}
              </span>
              {amountCol ? <span className="shrink-0 font-semibold tabular-nums">{fmt(Number(r[amountCol.key]))}</span> : null}
            </li>
          ))}
          {shown.length === 0 ? <li className="py-6 text-center text-sm text-ink-soft">Nothing matches “{q}”.</li> : null}
          {amountCol && shown.length ? (
            <li className="flex items-center justify-between py-3 text-sm font-bold">
              <span>Total · {shown.length}</span>
              <span className="tabular-nums">{fmt(totals[amountCol.key])}</span>
            </li>
          ) : null}
        </ul>
        {shown.length > PHONE_ROWS ? (
          <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 w-full rounded-full border border-line py-2 text-sm font-semibold text-ink-soft md:hidden">
            {all ? "Show less" : `Show all ${shown.length}`}
          </button>
        ) : null}
        <div className="hidden max-h-[28rem] overflow-auto rounded-xl border border-[#eadfc8] md:block">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-[#f6efe0] text-left text-xs text-ink-soft">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={`whitespace-nowrap px-3 py-2 font-semibold ${c.kind === "money" ? "text-right" : ""} ${c.wide ? "hidden md:table-cell" : ""}`}
                  >
                    <button type="button" onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 hover:text-ink">
                      {c.label}
                      <span aria-hidden className={sort.key === c.key ? "text-forest" : "opacity-30"}>
                        {sort.key === c.key && sort.dir === "asc" ? "▲" : "▼"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i} className="border-t border-[#eadfc8] bg-white hover:bg-[#fffaf0]">
                  {columns.map((c) => {
                    const v = r[c.key];
                    return (
                      <td
                        key={c.key}
                        className={`px-3 py-2 ${c.kind === "money" ? "whitespace-nowrap text-right font-semibold tabular-nums" : ""} ${c.kind === "date" ? "whitespace-nowrap text-ink-soft" : ""} ${c.wide ? "hidden md:table-cell" : ""} ${c.key === "message" || c.key === "purpose" ? "max-w-56 truncate" : ""}`}
                        title={c.kind === "text" && String(v).length > 30 ? String(v) : undefined}
                      >
                        {c.kind === "money" ? fmt(Number(v)) : c.kind === "date" ? shortDate(String(v)) : c.kind === "pill" ? <Pill value={String(v)} /> : c.key.endsWith("_ref") ? <span className="font-mono text-xs text-ink-soft">{v}</span> : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="bg-white px-3 py-6 text-center text-ink-soft">
                    Nothing matches “{q}”.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {moneyCols.length && shown.length ? (
              <tfoot className="sticky bottom-0 bg-[#f6efe0] text-sm">
                <tr className="border-t border-line">
                  {columns.map((c, i) => (
                    <td key={c.key} className={`px-3 py-2 font-bold ${c.kind === "money" ? "whitespace-nowrap text-right tabular-nums" : ""} ${c.wide ? "hidden md:table-cell" : ""}`}>
                      {c.kind === "money" ? fmt(totals[c.key]) : i === 0 ? `Total · ${shown.length}` : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        </>
      )}
    </div>
  );
}
