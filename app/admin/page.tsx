import { notFound, redirect } from "next/navigation";
import { Provider, providerFor } from "@/components/provider";
import { connection } from "next/server";
import { Logo, SandboxBadge } from "@/components/brand";
import { money } from "@/lib/format";
import { RATE_KEYS, RATE_LABELS, quotePayment, quotePayout, rateSummary, type Rate, type RateKey, type Rates } from "@/lib/pricing";
import { getRates, saveRates } from "@/lib/services/settings";
import { isAdmin, recentActivity, revenue } from "@/lib/services/admin";
import { snippeConfigured, paypalConfigured, env } from "@/lib/env";
import { ourWebhookUrl, pointNumberHere, webhookStatus } from "@/lib/channels/whatsapp-webhook";

export const metadata = { title: "Admin · SarafuPay", robots: { index: false } };

async function saveAction(form: FormData) {
  "use server";
  const key = String(form.get("key") ?? "");
  if (!isAdmin(key)) notFound();
  const current = await getRates();
  const next: Partial<Record<RateKey, Rate>> = {};
  for (const k of RATE_KEYS) {
    const n = (f: string) => Number(String(form.get(`${k}.${f}`) ?? "").replace(/,/g, ""));
    // Fixed amounts are typed in shillings or dollars; stored in cents like everything else.
    next[k] = {
      providerPct: n("providerPct"),
      providerFixedCents: Math.round(n("providerFixed") * 100),
      providerCapCents: Math.round(n("providerCap") * 100),
      sarafuPct: n("sarafuPct"),
    };
  }
  await saveRates({ ...current, ...next });
  redirect(`/admin?key=${encodeURIComponent(key)}&saved=1`);
}

async function connectWhatsAppAction(form: FormData) {
  "use server";
  const key = String(form.get("key") ?? "");
  if (!isAdmin(key)) notFound();
  const r = await pointNumberHere();
  redirect(`/admin?key=${encodeURIComponent(key)}&wa=${r.ok ? "ok" : encodeURIComponent(r.detail ?? "failed")}`);
}

/** Worked example for one row, so a typo in a rate is visible before anyone pays it. */
function example(rates: Rates, k: RateKey): string {
  const L = RATE_LABELS[k];
  const amt = L.currency === "TZS" ? 100_000_00 : 100_00;
  const q =
    k === "snippePayment" ? quotePayment(rates, "snippe", amt)
    : k === "paypalPayment" ? quotePayment(rates, "paypal", amt)
    : quotePayout(rates, k === "paypalPayout" ? "paypal" : k === "snippePayoutBank" ? "bank" : "mobile_money", amt);
  const who = L.kind === "payment" ? "collection gets" : "organiser gets";
  return `${money(amt, L.currency)} → ${L.provider} ${money(q.providerFeeCents, L.currency)} · SarafuPay ${money(q.sarafuFeeCents, L.currency)} · ${who} ${money(q.netCents, L.currency)}`;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await connection();
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  if (!isAdmin(key)) notFound();
  const [rates, rev, act, wa] = await Promise.all([getRates(), revenue(), recentActivity(12), webhookStatus()]);
  const waMsg = typeof sp.wa === "string" ? sp.wa : null;
  const earned = new Map<string, number>();
  for (const r of rev) earned.set(r.currency, (earned.get(r.currency) ?? 0) + r.sarafuCents);

  return (
    <div className="min-h-screen">
      <div className="kanga" />
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 text-xs">
          <SandboxBadge />
          <span className={`rounded-full px-3 py-1 ${snippeConfigured() ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>
            <Provider name="Snippe" /> {snippeConfigured() ? "connected" : "not configured"}
          </span>
          <span className={`rounded-full px-3 py-1 ${paypalConfigured() ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>
            <Provider name="PayPal" /> {paypalConfigured() ? env.paypalEnv() : "not configured"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-5 pb-20 sm:px-6">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Admin</p>
          <h1 className="font-display mt-2 text-4xl font-semibold">Pricing and earnings</h1>
        </section>

        {/* WhatsApp: which website this number's messages go to */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold">WhatsApp</h2>
          {!wa.configured ? (
            <p className="mt-2 text-sm text-ink-soft">Not configured: add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.</p>
          ) : (
            <>
              <dl className="mt-3 grid gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-[10rem_1fr]">
                <dt className="text-ink-soft">This number</dt>
                <dd>{env.waDisplayNumber() ? `+${env.waDisplayNumber()}` : env.waPhoneNumberId()}</dd>
                <dt className="text-ink-soft">Number override</dt>
                <dd>{wa.phoneOverride || "none"}</dd>
                <dt className="text-ink-soft">App default</dt>
                <dd>{wa.appDefault || "unknown"}</dd>
                <dt className="text-ink-soft">Status</dt>
                <dd className={wa.pointsHere ? "font-semibold text-forest" : "font-semibold text-terracotta"}>
                  {wa.error ? `error: ${wa.error}` : wa.pointsHere ? "messages arrive here ✓" : "messages go elsewhere"}
                </dd>
              </dl>
              {waMsg ? (
                <p className={`mt-3 rounded-lg p-3 text-sm ${waMsg === "ok" ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>
                  {waMsg === "ok" ? "Done. This number now sends its messages to sarafupay.app." : waMsg}
                </p>
              ) : null}
              {!wa.pointsHere ? (
                <form action={connectWhatsAppAction} className="mt-4">
                  <input type="hidden" name="key" value={key} />
                  <button className="btn btn-primary">Send this number&apos;s messages to {ourWebhookUrl()}</button>
                  <p className="mt-2 text-xs text-ink-soft">Only this number changes. Other numbers in the Meta app keep their own website.</p>
                </form>
              ) : null}
            </>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...earned.entries()].map(([cur, cents]) => (
            <div key={cur} className="card p-5">
              <p className="text-sm text-ink-soft">SarafuPay earned · {cur}</p>
              <p className="font-display mt-1 text-3xl font-semibold">{money(cents, cur)}</p>
            </div>
          ))}
          {rev.map((r) => (
            <div key={`${r.kind}${r.currency}`} className="card p-5">
              <p className="text-sm text-ink-soft">
                {r.kind === "payments" ? "Payments" : "Payouts"} · {r.currency} · {r.count}
              </p>
              <p className="font-display mt-1 text-2xl font-semibold">{money(r.grossCents, r.currency)}</p>
              <p className="mt-1 text-xs text-ink-soft">
                Providers {money(r.providerCents, r.currency)} · SarafuPay {money(r.sarafuCents, r.currency)}
              </p>
            </div>
          ))}
          {rev.length === 0 ? <p className="text-sm text-ink-soft">No settled payments yet.</p> : null}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Rates</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Provider fees come from Snippe&apos;s and PayPal&apos;s price lists. SarafuPay&apos;s percentage is taken on the full amount.
            Changes apply to new payments and payouts only; every past transaction keeps the rates it used.
          </p>
          {sp.saved ? <p className="mt-3 inline-block rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">Saved. New rates are live.</p> : null}
          <form action={saveAction} className="card mt-4 overflow-x-auto">
            <input type="hidden" name="key" value={key} />
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Charge</th>
                  <th className="px-3 py-3">Provider %</th>
                  <th className="px-3 py-3">Provider fixed</th>
                  <th className="px-3 py-3">Provider cap</th>
                  <th className="px-3 py-3">SarafuPay %</th>
                  <th className="px-4 py-3">Public price · example</th>
                </tr>
              </thead>
              <tbody>
                {RATE_KEYS.map((k) => {
                  const r = rates[k];
                  const L = RATE_LABELS[k];
                  const unit = L.currency === "TZS" ? "TZS" : "USD";
                  const cell = "w-24 rounded-lg border border-line bg-white px-2 py-1.5 font-mono";
                  return (
                    <tr key={k} className="border-t border-line align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{L.title}</p>
                        <p className="text-xs text-ink-soft">{L.provider} · {L.currency}</p>
                      </td>
                      <td className="px-3 py-3"><input aria-label={`${L.title} provider percent`} name={`${k}.providerPct`} defaultValue={r.providerPct} inputMode="decimal" className={cell} /></td>
                      <td className="px-3 py-3">
                        <input aria-label={`${L.title} provider fixed fee`} name={`${k}.providerFixed`} defaultValue={r.providerFixedCents / 100} inputMode="decimal" className={cell} />
                        <span className="ml-1 text-xs text-ink-soft">{unit}</span>
                      </td>
                      <td className="px-3 py-3">
                        <input aria-label={`${L.title} provider fee cap`} name={`${k}.providerCap`} defaultValue={r.providerCapCents / 100} inputMode="decimal" className={cell} />
                        <span className="ml-1 text-xs text-ink-soft">{unit}</span>
                      </td>
                      <td className="px-3 py-3"><input aria-label={`${L.title} SarafuPay percent`} name={`${k}.sarafuPct`} defaultValue={r.sarafuPct} inputMode="decimal" className={cell} /></td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{rateSummary(r, L.currency)}</p>
                        <p className="mt-0.5 font-mono text-xs text-ink-soft">{example(rates, k)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-xs text-ink-soft">Cap 0 = no cap. Percentages are capped at 50%.</p>
              <button className="btn btn-primary">Save rates</button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold">Latest payments</h2>
            <ul className="card mt-3 divide-y divide-line text-sm">
              {act.contribs.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">
                    {c.displayName} · <span className="text-ink-soft"><Provider name={providerFor(c.provider)} /> · {c.status}</span>
                  </span>
                  <span className="shrink-0 font-mono">
                    {money(c.amountCents, c.currency)}
                    {c.sarafuFeeCents != null ? <span className="text-ink-soft"> (+{money(c.sarafuFeeCents, c.currency)})</span> : null}
                  </span>
                </li>
              ))}
              {act.contribs.length === 0 ? <li className="px-4 py-3 text-ink-soft">None yet.</li> : null}
            </ul>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold">Latest payouts</h2>
            <ul className="card mt-3 divide-y divide-line text-sm">
              {act.pays.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">
                    {p.recipientName ?? "Recipient"} · <span className="text-ink-soft">{p.method} · {p.status}</span>
                  </span>
                  <span className="shrink-0 font-mono">
                    {money(p.amountCents, p.currency)}
                    {p.sarafuFeeCents != null ? <span className="text-ink-soft"> (+{money(p.sarafuFeeCents, p.currency)})</span> : null}
                  </span>
                </li>
              ))}
              {act.pays.length === 0 ? <li className="px-4 py-3 text-ink-soft">None yet.</li> : null}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
