"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CoinMark } from "@/components/coin-mark";
import { ex, tr, type Visitor } from "@/lib/locale";

type Msg = { from: "me" | "bot"; text: string };

/** The demo chat, in the visitor's language and money. Mobile money in Tanzania, card elsewhere. */
function script(v: Visitor): Msg[] {
  const target = ex(v, 3_000_000);
  const gift = ex(v, 50_000);
  const pay = ex(v, 600_000);
  const net = v.mobileMoney ? ex(v, 598_500) : ex(v, 588_000);
  return [
    { from: "me", text: tr(v, "Habari! Nataka kuchangisha kwa harusi ya dada yangu Neema 💍", "Hi! I want to collect for my sister Neema's wedding 💍") },
    { from: "bot", text: tr(v, "Hongera! 🎉 Lengo ni kiasi gani, na mwisho lini?", "Congratulations! 🎉 What's the target, and by when?") },
    { from: "me", text: tr(v, `${target} kabla ya 20 Desemba`, `${target} by 20 December`) },
    { from: "bot", text: tr(v, "Tayari ✅ Msimbo wako ni *NEEMA24*.\nTuma ujumbe huu kwenye magroup yako 👇", "Done ✅ Your code is *NEEMA24*.\nShare this in your groups 👇") },
    {
      from: "bot",
      text: v.mobileMoney
        ? tr(v, `💰 *Amina* amechangia ${gift} kwa simu\n▓▓▓░░░░░░░ 31%`, `💰 *Amina* gave ${gift} by mobile money\n▓▓▓░░░░░░░ 31%`)
        : tr(v, `💰 *Amina* amechangia ${gift} kwa kadi\n▓▓▓░░░░░░░ 31%`, `💰 *Amina* gave ${gift} by card\n▓▓▓░░░░░░░ 31%`),
    },
    {
      from: "me",
      text: v.mobileMoney
        ? tr(v, `Mlipe mpishi ${pay} kwenye 0712 345 678`, `Pay the caterer ${pay} to 0712 345 678`)
        : tr(v, `Mlipe mpishi ${pay} kwa PayPal`, `Pay the caterer ${pay} by PayPal`),
    },
    { from: "bot", text: tr(v, `🔐 Atapokea *${net}* baada ya ada.\nJibu *CONFIRM 482913* kutuma.`, `🔐 They'll get *${net}* after fees.\nReply *CONFIRM 482913* to send.`) },
  ];
}

function Bubble({ m }: { m: Msg }) {
  return (
    <div className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
      <p
        className="bubble bubble-demo max-w-[84%] whitespace-pre-line rounded-2xl px-3 py-2"
        style={{ background: m.from === "me" ? "var(--bubble-out)" : "var(--bubble-in)" }}
      >
        {m.text.split(/(\*[^*]+\*)/).map((part, j) =>
          part.startsWith("*") ? <strong key={j}>{part.slice(1, -1)}</strong> : <span key={j}>{part}</span>,
        )}
      </p>
    </div>
  );
}

/**
 * A WhatsApp conversation on a phone held in 3D: it leans toward the pointer, and three
 * glass cards (a payment, the progress, a payout) float in front of it at different depths.
 * The chat plays line by line and loops. Reduced motion: everything shown, no tilt.
 */
export function Phone3D({ v }: { v: Visitor }) {
  const SCRIPT = useMemo(() => script(v), [v]);
  const stage = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(1);
  const [typing, setTyping] = useState(false);

  // Conversation loop.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setShown(SCRIPT.length), 0);
      return () => clearTimeout(t);
    }
    let n = 1;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (n >= SCRIPT.length) {
        timer = setTimeout(() => {
          n = 1;
          setShown(1);
          timer = setTimeout(next, 1400);
        }, 4200);
        return;
      }
      const bot = SCRIPT[n].from === "bot";
      setTyping(bot);
      timer = setTimeout(() => {
        setTyping(false);
        n += 1;
        setShown(n);
        timer = setTimeout(next, 900);
      }, bot ? 1100 : 700);
    };
    timer = setTimeout(next, 1200);
    return () => clearTimeout(timer);
  }, [SCRIPT]);

  // Pointer tilt, eased with rAF; writes CSS variables only (no React re-render per frame).
  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.2)));
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      el.style.setProperty("--rx", `${(-cur.y * 10).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(cur.x * 14 - 8).toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const msgs = SCRIPT.slice(0, shown);

  return (
    <div ref={stage} className="phone-stage relative mx-auto w-full max-w-[22rem]" style={{ perspective: "1400px" }}>
      <div className="phone-rig relative" style={{ transformStyle: "preserve-3d" }}>
        {/* the phone */}
        <div className="phone-body relative overflow-hidden rounded-[2.4rem] border-[10px] border-ink bg-[var(--chat-bg)]" style={{ transform: "translateZ(0)" }}>
          <div className="flex items-center gap-3 bg-forest px-4 py-3 text-paper">
            <CoinMark size={36} />
            <div>
              <p className="text-sm font-semibold">SarafuPay</p>
              <p className="text-[11px] opacity-75">{typing ? tr(v, "inaandika…", "typing…") : "online"}</p>
            </div>
          </div>
          <div className="flex h-[27rem] flex-col justify-end gap-2 overflow-hidden px-3 py-4 text-[13px] leading-snug">
            {msgs.map((m, i) => (
              <Bubble key={i} m={m} />
            ))}
            {typing ? (
              <div className="flex justify-start">
                <span className="bubble rounded-2xl px-3 py-2.5" style={{ background: "var(--bubble-in)" }}>
                  <span className="typing"><i /><i /><i /></span>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* floating cards, each at its own depth */}
        <div className="float-card -left-24 top-[4.5rem] hidden lg:block" style={{ "--z": "40px", "--d": "0s" } as React.CSSProperties}>
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">{tr(v, "Malipo yamepokelewa", "Payment received")}</p>
          <p className="font-display text-xl font-semibold">{ex(v, 50_000)}</p>
          <p className="text-xs text-ink-soft">Amina · {v.mobileMoney ? tr(v, "pesa ya simu", "mobile money") : tr(v, "kadi", "card")}</p>
        </div>
        <div className="float-card -right-16 -top-8 hidden lg:block" style={{ "--z": "70px", "--d": "-2s" } as React.CSSProperties}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--paper-2)" strokeWidth="5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--forest)" strokeWidth="5" strokeDasharray="94.2" strokeDashoffset="36" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-display text-xl font-semibold leading-none">62%</p>
              <p className="text-xs text-ink-soft">{tr(v, "kati ya", "of")} {ex(v, 3_000_000)}</p>
            </div>
          </div>
        </div>
        <div className="float-card -left-16 -bottom-12 hidden lg:block" style={{ "--z": "50px", "--d": "-4s" } as React.CSSProperties}>
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">{tr(v, "Taarifa ya uwazi", "Transparency update")}</p>
          <p className="text-sm font-semibold">{tr(v, "Mpishi amepokea", "Caterer received")} {v.mobileMoney ? ex(v, 598_500) : ex(v, 588_000)}</p>
          <p className="text-xs text-ink-soft">{tr(v, "Kwa wachangiaji 38", "Sent to 38 contributors")}</p>
        </div>
      </div>
    </div>
  );
}
