"use client";

import { useEffect, useRef, useState } from "react";
import { Provider } from "@/components/provider";

type Msg = { from: "me" | "bot"; text: string };

const SCRIPT: Msg[] = [
  { from: "me", text: "Habari! Nataka kuchangisha kwa harusi ya dada yangu Neema 💍" },
  { from: "bot", text: "Hongera! 🎉 Lengo ni kiasi gani, na mwisho lini?" },
  { from: "me", text: "TZS 3,000,000 kabla ya 20 Desemba" },
  { from: "bot", text: "Tayari ✅ Msimbo wako ni *NEEMA24*.\nTuma ujumbe huu kwenye magroup yako 👇" },
  { from: "bot", text: "💰 *Amina* amechangia TZS 50,000 kwa simu\n▓▓▓░░░░░░░ 31%" },
  { from: "me", text: "Mlipe mpishi TZS 600,000 kwenye 0712 345 678" },
  { from: "bot", text: "🔐 Atapokea *TZS 583,500* baada ya ada.\nJibu *CONFIRM 482913* kutuma." },
];

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
export function Phone3D() {
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
  }, []);

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
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
            <img src="/brand/sarafupay-icon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full bg-paper" />
            <div>
              <p className="text-sm font-semibold">SarafuPay</p>
              <p className="text-[11px] opacity-75">{typing ? "inaandika…" : "online"}</p>
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
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">Payment received</p>
          <p className="font-display text-xl font-semibold">TZS 50,000</p>
          <p className="flex items-center gap-2 text-xs text-ink-soft">Amina <Provider name="Snippe" label={false} size="1.4em" /></p>
        </div>
        <div className="float-card -right-16 -top-8 hidden lg:block" style={{ "--z": "70px", "--d": "-2s" } as React.CSSProperties}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--paper-2)" strokeWidth="5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--forest)" strokeWidth="5" strokeDasharray="94.2" strokeDashoffset="36" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-display text-xl font-semibold leading-none">62%</p>
              <p className="text-xs text-ink-soft">of TZS 3,000,000</p>
            </div>
          </div>
        </div>
        <div className="float-card -left-16 -bottom-12 hidden lg:block" style={{ "--z": "50px", "--d": "-4s" } as React.CSSProperties}>
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">Transparency update</p>
          <p className="text-sm font-semibold">Caterer received TZS 583,500</p>
          <p className="text-xs text-ink-soft">Sent to 38 contributors</p>
        </div>
      </div>
    </div>
  );
}
