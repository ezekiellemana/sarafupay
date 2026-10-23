import { Suspense } from "react";
import { TiltCard } from "@/components/landing/tilt-card";
import { ScrollFX } from "@/components/scroll-fx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Progress } from "@/components/brand";
import { SiteFooter, SiteHeader } from "@/components/site";
import { collectionStats, findCollection, getUser, listPayouts, searchSupporters, type Supporter } from "@/lib/services/core";
import { money } from "@/lib/format";
import { waLink } from "@/lib/channels/whatsapp";
import { categoryEmoji, categoryPhoto, simulatorUrl } from "@/lib/services/links";
import { Photo } from "@/components/landing/photo";
import { contributeAction } from "./actions";
import { ChipIn } from "./chip-in";
import { SupporterSearch } from "./supporter-search";


export default async function CollectionPage({ params, searchParams }: PageProps<"/c/[code]">) {
  await connection();
  const { code } = await params;
  const sp = await searchParams;
  const col = await findCollection(code);
  if (!col) notFound();
  const q = typeof sp.q === "string" ? sp.q : "";
  const pageNo = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const [stats, owner, supporters, pays] = await Promise.all([
    collectionStats(col),
    getUser(col.ownerId),
    searchSupporters(col.id, { q, page: pageNo, pageSize: 8 }),
    listPayouts(col.id),
  ]);
  const ledger = pays.filter((p) => p.status === "success" || p.status === "processing");
  const chat = waLink(`Contribute ${col.code}`) ?? simulatorUrl(`Contribute ${col.code}`);
  const err = typeof sp.err === "string" ? sp.err : null;

  return (
    <div className="min-h-screen overflow-x-clip">
      <ScrollFX />
      <div className="kanga" />
      <SiteHeader cta={false} />

      {/* ---------- Banner: the occasion photo, drifting in depth behind the title ---------- */}
      <section className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="col-banner rise">
          <div className="col-banner-img" data-depth>
            <Photo shot={{ name: categoryPhoto(col.category), alt: "" }} sizes="(min-width: 1152px) 1152px, 100vw" />
          </div>
          <div className="col-banner-shade" aria-hidden />
          <div className="relative flex h-full flex-col justify-end p-5 sm:p-8">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-paper/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
              {categoryEmoji(col.category)} {col.category} · {col.code}
            </p>
            <h1 className="font-display mt-3 max-w-3xl break-words text-[2.1rem] font-semibold leading-[1.05] text-paper sm:text-6xl">{col.title}</h1>
            <p className="mt-2 text-sm text-paper/85">
              by <strong className="text-paper">{owner?.name ?? "the organiser"}</strong>
              {col.deadline ? <> · closes {col.deadline}</> : null}
              {col.status !== "active" ? <> · <span className="rounded-full bg-terracotta px-2 py-0.5 font-semibold text-paper">closed</span></> : null}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-5 pb-20 sm:px-6 lg:mt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-10">
        {/* Raised so far */}
        <section className="min-w-0 rise d1">
          {col.purpose ? <p className="col-purpose mb-5 max-w-xl text-lg leading-relaxed text-ink-soft">{col.purpose}</p> : null}
          <TiltCard fill={false} className="card stats-3d p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-[2.1rem] font-semibold leading-none sm:text-5xl">{money(stats.raisedCents, col.currency)}</p>
                <p className="mt-1 text-sm text-ink-soft">of {money(col.targetCents, col.currency)}</p>
              </div>
              <div className="ring-3d" style={{ "--pct": Math.min(100, stats.percent) } as React.CSSProperties}>
                <svg viewBox="0 0 36 36" aria-hidden>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--paper-2)" strokeWidth="4.5" />
                  <circle className="ring-3d-fill" cx="18" cy="18" r="15" fill="none" stroke="var(--forest)" strokeWidth="4.5" strokeLinecap="round" />
                </svg>
                <span className="ring-3d-label font-display">{stats.percent}%</span>
              </div>
            </div>
            <div className="mt-4"><Progress percent={stats.percent} /></div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {[
                [String(stats.paidCount), stats.paidCount === 1 ? "gift" : "gifts"],
                [compact(stats.paidOutCents, col.currency), "paid out"],
                [compact(stats.availableCents, col.currency), "balance"],
              ].map(([k, v]) => (
                <div key={v} className="stat-chip">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-xs text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
            {stats.balances.slice(1).map((b) => (
              <p key={b.currency} className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm text-ink-soft">
                💳 <strong className="text-ink">{money(b.raisedCents, b.currency)}</strong> by card
              </p>
            ))}
          </TiltCard>
        </section>

        {/* Chip in: right after the numbers on phones, a sticky column on desktop */}
        <aside id="chip-in" className="rise d2 min-w-0 h-fit scroll-mt-4 lg:sticky lg:top-6 lg:row-span-2">
          <form action={contributeAction.bind(null, col.code)} className="card chip-card overflow-hidden">
            <div className="chip-head px-6 py-5 text-paper">
              <p className="font-display text-2xl font-semibold">Chip in</p>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {sp.cancelled ? <p className="rounded-lg bg-paper-2 p-3 text-sm">Payment cancelled. No money moved.</p> : null}
              {err ? <p className="rounded-lg bg-terracotta/10 p-3 text-sm text-terracotta">{err === "amount" ? "Please enter a valid amount." : err}</p> : null}
              <ChipIn disabled={col.status !== "active"} />
              <p className="text-center text-xs text-ink-soft">
                <a href={chat} className="underline">Or chip in by chat</a>
              </p>
            </div>
          </form>
        </aside>

        {/* Where the money went + supporters */}
        <section className="min-w-0">
          <h2 className="font-display text-2xl font-semibold" data-reveal>Where the money went</h2>
          {ledger.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft" data-reveal>No payouts yet.</p>
          ) : (
            <ul className="mt-3 space-y-2" data-reveal>
              {ledger.map((p) => (
                <li key={p.id} className="ledger-card">
                  <span className="ledger-icon" aria-hidden>
                    {p.method === "paypal" ? "💳" : p.method === "bank" ? "🏦" : "📱"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{p.recipientName ?? "Recipient"}</strong>
                    <span className="block truncate text-xs text-ink-soft">
                      {p.note ?? (p.method === "bank" ? "bank" : p.method === "paypal" ? "card" : "mobile money")}
                      {p.status === "processing" ? <span className="ml-2 text-marigold">processing</span> : null}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold">{money(p.amountCents, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}

          {stats.paidCount > 0 ? (
            <section id="supporters" className="mt-10 scroll-mt-4" data-reveal>
              <h2 className="font-display text-2xl font-semibold">Supporters</h2>
              <div className="mt-3">
                <Suspense fallback={null}>
                  <SupporterSearch initial={q} />
                </Suspense>
              </div>
              <SupporterList items={supporters.items} q={q} byEmail={supporters.byEmail} />
              {supporters.pages > 1 ? (
                <Pager code={col.code} q={q} page={supporters.page} pages={supporters.pages} total={supporters.total} />
              ) : null}
            </section>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/** "564K", "1.2M", "$45": short amounts for the small stat boxes (the currency is shown above them). */
function compact(cents: number, currency: string): string {
  const v = cents / 100;
  const n = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  return currency === "USD" ? `$${n}` : n;
}

const AVATAR_TONES = ["bg-marigold/30", "bg-forest/15", "bg-terracotta/20", "bg-paper-2"];

function ago(d: Date): string {
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Infinity]];
  let v = s;
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return rtf.format(Math.round(v), unit);
    v /= size;
  }
  return "";
}

function SupporterList({ items, q, byEmail }: { items: Supporter[]; q: string; byEmail: boolean }) {
  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
        {byEmail ? (
          <>No contribution found for that email. Check it&apos;s the email you used on PayPal.</>
        ) : (
          <>No supporters named &ldquo;{q}&rdquo; yet.</>
        )}
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-[#fffaf0]">
      {items.map((s, i) => (
        <li key={s.id} className="supporter-row flex items-start gap-3 px-4 py-3" style={{ animationDelay: `${i * 30}ms` }}>
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-semibold text-ink ${AVATAR_TONES[s.name.charCodeAt(0) % AVATAR_TONES.length]}`}
            aria-hidden
          >
            {s.name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-semibold">{s.name}</p>
              <time dateTime={s.paidAt.toISOString()} className="shrink-0 text-xs text-ink-soft">
                {ago(s.paidAt)}
              </time>
            </div>
            {s.message ? <p className="mt-0.5 break-words text-sm text-ink-soft">&ldquo;{s.message}&rdquo;</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Pager({ code, q, page, pages, total }: { code: string; q: string; page: number; pages: number; total: number }) {
  const href = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return `/c/${code}${qs ? `?${qs}` : ""}#supporters`;
  };
  // 1 … 4 5 6 … 12
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const cells: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) cells.push("gap");
    cells.push(n);
  });
  const base = "grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm transition-colors";
  return (
    <nav aria-label="Supporters pages" className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-ink-soft">
        Page {page} of {pages} · {total} supporters
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} scroll={false} className={`${base} border border-line hover:border-forest`} aria-label="Previous page">
            ‹
          </Link>
        ) : null}
        {cells.map((c, i) =>
          c === "gap" ? (
            <span key={`g${i}`} className="hidden px-1 text-ink-soft sm:inline">…</span>
          ) : (
            <Link
              key={c}
              href={href(c)}
              scroll={false}
              aria-current={c === page ? "page" : undefined}
              className={`${base} hidden sm:grid ${c === page ? "!grid bg-forest font-semibold text-paper" : "hover:bg-paper-2"}`}
            >
              {c}
            </Link>
          ),
        )}
        {page < pages ? (
          <Link href={href(page + 1)} scroll={false} className={`${base} border border-line hover:border-forest`} aria-label="Next page">
            ›
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
