"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Progress } from "@/components/brand";
import { Ban, Card as CardIcon } from "@/components/icons";
import { CoinField } from "@/components/landing/coin-field";
import { copy } from "@/lib/copy";
import type { Lang } from "@/lib/i18n";
import type { PayStatus } from "@/lib/services/pay-status";
import { resendPromptAction, tryAgainAction } from "./actions";

/** How the payer came back from PayPal, from the return/cancel routes. */
export type CardFlag = "returned" | "cancelled" | "declined" | null;

const SLOW_AFTER = 45; // s without a PIN: offer to resend
const EXPIRED_AFTER = 120; // s: the USSD prompt has almost certainly closed

/**
 * The payer's screen from "prompt sent" to "thank you", for mobile money and card. It polls the
 * payment while anything is in progress, so every stage shows as it happens, and every ending
 * without money says so plainly and offers the next step.
 */
export function PaymentStatus({ initial, lang, flag, shareUrl }: { initial: PayStatus; lang: Lang; flag: CardFlag; shareUrl: string }) {
  const t = copy(lang).payStatus;
  const [s, setStatus] = useState(initial);
  // When `s` was last fetched, so the prompt's age keeps counting between polls.
  const [syncedAt, setSyncedAt] = useState(() => Date.now());
  const [now, setNow] = useState(syncedAt);
  const setS = (next: PayStatus) => {
    setStatus(next);
    setSyncedAt(Date.now());
  };
  const [resend, setResend] = useState<"idle" | "sent" | "failed">("idle");
  const [busy, startBusy] = useTransition();

  const live = s.state === "waiting_pin" || s.state === "confirming" || (s.state === "card_open" && flag === "returned");
  useEffect(() => {
    if (!live) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/pay/status/${s.id}`, { cache: "no-store" });
        if (r.ok) setS((await r.json()) as PayStatus);
      } catch {
        /* offline for a moment: try again on the next tick */
      }
    }, 3000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [live, s.id]);

  // Seconds since the prompt went out, counted locally between polls.
  const age = s.promptAge == null ? 0 : s.promptAge + Math.max(0, Math.round((now - syncedAt) / 1000));
  const back = (
    <Link href={`/c/${s.collection.code}`} className="btn btn-ghost w-full justify-center">
      {t.back} {s.collection.code}
    </Link>
  );
  const tryAgain = (label = t.tryAgain) => (
    <form action={tryAgainAction.bind(null, s.id)}>
      <button className="btn btn-primary w-full justify-center">{label}</button>
    </form>
  );

  if (s.state === "paid") {
    return (
      <>
        {/* The coins rain only around the tick, so they never cross the words below. */}
        <div className="relative -mx-6 -mt-6 overflow-hidden rounded-t-[22px] pt-6 pb-1 sm:-mx-8 sm:-mt-8 sm:pt-8">
          <CoinField className="pointer-events-none absolute inset-0 opacity-50" />
          <div className="paid-coin relative" aria-hidden>
            <span>✓</span>
          </div>
        </div>
        <div>
          <h1 className="font-display mt-5 text-3xl font-semibold">{t.paidTitle}</h1>
          <p className="mt-2 text-ink-soft">{t.paidBody(s.amount, s.collection.title)}</p>
          <p className="mt-1 text-sm text-ink-soft">{t.receipt}</p>
          {s.ref ? (
            <p className="mt-2 font-mono text-xs text-ink-soft">
              {t.ref} {s.ref}
            </p>
          ) : null}
          <ProgressBlock s={s} label={t.progress(s.collection.raised, s.collection.target)} />
          <div className="mt-6 space-y-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(t.shareText(s.collection.title, shareUrl))}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary w-full justify-center"
            >
              {t.share}
            </a>
            {back}
          </div>
        </div>
      </>
    );
  }

  if (s.state === "failed" || (s.method === "card" && s.state === "card_open" && (flag === "cancelled" || flag === "declined"))) {
    const f =
      s.method === "card"
        ? flag === "cancelled"
          ? t.cardCancelled
          : t.cardDeclined
        : t.failed[s.failReason ?? "declined"];
    const cardResume = s.method === "card" && s.state === "card_open";
    return (
      <>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-terracotta/10 text-terracotta" aria-hidden>
          {s.method === "card" ? <CardIcon size={36} /> : <Ban size={36} />}
        </span>
        <h1 className="font-display mt-5 text-3xl font-semibold">{f.title}</h1>
        <p className="mt-2 text-ink-soft">{f.body}</p>
        <p className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-sm">
          <strong>{s.amount}</strong> · {s.collection.title}
        </p>
        <div className="mt-6 space-y-2">
          {cardResume ? (
            <a href={`/pay/${s.id}`} className="btn btn-primary w-full justify-center">
              {t.continueCard}
            </a>
          ) : (
            // Mobile money: a new attempt opens on the number screen, where the number can be changed.
            tryAgain()
          )}
          {back}
        </div>
      </>
    );
  }

  if (s.method === "card") {
    const confirming = s.state === "confirming" || flag === "returned";
    return (
      <>
        <div className="pay-spinner mx-auto" aria-hidden>
          <CardIcon size={30} />
        </div>
        <h1 className="font-display mt-5 text-3xl font-semibold">{confirming ? t.confirmingTitle : t.cardOpenTitle}</h1>
        <p className="mt-2 text-ink-soft">{confirming ? t.confirmingBody("PayPal") : t.cardOpenBody}</p>
        <p className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-sm">
          <strong>{s.amount}</strong> · {s.collection.title}
        </p>
        {!confirming ? (
          <div className="mt-6 space-y-2">
            <a href={`/pay/${s.id}`} className="btn btn-primary w-full justify-center">
              {t.continueCard}
            </a>
            {back}
          </div>
        ) : null}
      </>
    );
  }

  // Mobile money: the prompt is out (or about to be), waiting for the PIN.
  const net = s.network ?? "mobile money";
  const slow = age >= SLOW_AFTER;
  const expired = age >= EXPIRED_AFTER;
  const mmss = `${Math.floor(age / 60)}:${String(age % 60).padStart(2, "0")}`;
  return (
    <>
      <div className={`ussd-phone ${expired ? "is-stale" : ""}`} aria-hidden>
        <div className="ussd-screen">
          <p className="ussd-net">{net}</p>
          <div className="ussd-dialog">
            <p>SarafuPay</p>
            <p className="ussd-amt">{s.amount}</p>
            <p className="ussd-pin">
              PIN <span className="wait-dots"><i /><i /><i /><i /></span>
            </p>
          </div>
        </div>
      </div>
      <ol className="pay-steps mt-6" aria-label="Progress">
        <li className="is-done">{t.steps.sent}</li>
        <li className="is-on">{t.steps.pin}</li>
        <li>{t.steps.done}</li>
      </ol>
      <h1 className="font-display mt-5 text-3xl font-semibold">{expired ? t.expiredTitle : slow ? t.slowTitle : t.waitTitle}</h1>
      <p className="mt-2 text-ink-soft" aria-live="polite">
        {expired ? t.expiredBody : slow ? t.slowBody : t.waitBody(s.amount, net, s.phone)}
      </p>
      <p className="mt-3 font-mono text-xs text-ink-soft">
        {t.elapsed} {mmss}
      </p>
      {slow ? (
        <div className="mt-5 space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              startBusy(async () => {
                const r = await resendPromptAction(s.id);
                setResend(r.ok ? "sent" : "failed");
                if (r.ok) setS({ ...s, promptAge: 0 });
              })
            }
            className={`btn w-full justify-center ${expired ? "btn-primary" : "btn-ghost"}`}
          >
            {busy ? "…" : t.resend}
          </button>
          {resend !== "idle" ? (
            <p role="status" className={`text-sm ${resend === "sent" ? "text-forest" : "text-terracotta"}`}>
              {resend === "sent" ? t.resent : t.resendFailed}
            </p>
          ) : null}
          <Link href={`/pay/${s.id}/mobile`} className="btn btn-ghost w-full justify-center">
            {t.changeNumber}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-1.5 text-left text-sm text-ink-soft">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-forest" aria-hidden>
                •
              </span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProgressBlock({ s, label }: { s: PayStatus; label: string }) {
  return (
    <div className="mt-6 text-left">
      <Progress percent={s.collection.percent} />
      <p className="mt-2 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
