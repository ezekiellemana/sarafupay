"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ex, tr, type Visitor } from "@/lib/locale";

const DURATION = 5600;

const NUMS = ["01", "02", "03"];

/* ---------- the three scenes (pure CSS 3D; animations restart when the scene remounts) ---------- */

function SceneStart({ v }: { v: Visitor }) {
  return (
    <div className="hs-scene">
      <div className="hs-phone" style={{ "--z": "0px" } as React.CSSProperties}>
        <div className="hs-phone-top" />
        <div className="hs-chat">
          <p className="hs-bubble hs-out" style={{ "--d": "0.2s" } as React.CSSProperties}>{tr(v, "Nataka kuchangisha harusi 💍", "Collecting for a wedding 💍")}</p>
          <p className="hs-bubble hs-in" style={{ "--d": "1.0s" } as React.CSSProperties}>{tr(v, "Hongera! Lengo ni kiasi gani?", "Congrats! What's the target?")}</p>
          <p className="hs-bubble hs-out" style={{ "--d": "1.8s" } as React.CSSProperties}>{ex(v, 3_000_000)}</p>
          <p className="hs-bubble hs-in" style={{ "--d": "2.6s" } as React.CSSProperties}>{tr(v, "Tayari ✅", "Done ✅")}</p>
        </div>
      </div>
      <div className="hs-card hs-pop" style={{ "--d": "3.1s" } as React.CSSProperties}>
        <p className="hs-k">{tr(v, "Harusi ya Neema", "Neema's wedding")}</p>
        <p className="hs-big">NEEMA24</p>
        <div className="hs-bar"><span style={{ width: "0%" }} /></div>
        <p className="hs-k">0 / {ex(v, 3_000_000)}</p>
      </div>
      <span className="hs-spark" style={{ "--d": "3.2s", "--x": "-120px", "--y": "-90px" } as React.CSSProperties} />
      <span className="hs-spark" style={{ "--d": "3.3s", "--x": "130px", "--y": "-70px" } as React.CSSProperties} />
      <span className="hs-spark" style={{ "--d": "3.4s", "--x": "110px", "--y": "100px" } as React.CSSProperties} />
    </div>
  );
}

/** Four friends chipping in (AI-generated portraits, public/people). */
const FRIENDS = [
  { x: -150, y: -95, z: 40, img: "amina", d: 0.5 },
  { x: 155, y: -80, z: 70, img: "juma", d: 1.1 },
  { x: -160, y: 95, z: 90, img: "bibi", d: 1.7 },
  { x: 150, y: 105, z: 30, img: "baraka", d: 2.3 },
];

function SceneShare({ v }: { v: Visitor }) {
  return (
    <div className="hs-scene">
      <div className="hs-card hs-center hs-pop" style={{ "--d": "0s" } as React.CSSProperties}>
        <p className="hs-k">sarafupay.app/c/NEEMA24</p>
        <div className="hs-ring">
          <svg viewBox="0 0 36 36" aria-hidden>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(14,59,44,.12)" strokeWidth="4.5" />
            <circle className="hs-ring-fill" cx="18" cy="18" r="15" fill="none" stroke="var(--forest)" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
          <span className="hs-ring-label">68%</span>
        </div>
        <p className="hs-k">{ex(v, 2_040_000)}</p>
      </div>
      {FRIENDS.map((f, i) => (
        <div key={i}>
          <span
            className="hs-friend hs-pop"
            style={{ "--d": `${f.d - 0.4}s`, transform: `translate3d(${f.x}px, ${f.y}px, ${f.z}px)` } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/people/${f.img}.webp`} alt="" width={60} height={60} loading="lazy" decoding="async" />
          </span>
          <span
            className="hs-coin hs-fly"
            style={{ "--d": `${f.d}s`, "--x": `${f.x}px`, "--y": `${f.y}px`, "--fz": `${f.z}px` } as React.CSSProperties}
          >
            S
          </span>
          <span
            className="hs-tick"
            style={{ "--d": `${f.d + 0.9}s`, transform: `translate3d(${f.x * 0.9}px, ${f.y + (f.y < 0 ? -44 : 44)}px, ${f.z}px)` } as React.CSSProperties}
          >
            +{ex(v, 50_000)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SceneOut({ v }: { v: Visitor }) {
  const digits = "482913".split("");
  return (
    <div className="hs-scene">
      <div className="hs-card hs-code hs-pop" style={{ "--d": "0s" } as React.CSSProperties}>
        <p className="hs-k">CONFIRM</p>
        <p className="hs-digits">
          {digits.map((d, i) => (
            <span key={i} className="hs-digit" style={{ "--d": `${0.3 + i * 0.16}s` } as React.CSSProperties}>
              {d}
            </span>
          ))}
        </p>
      </div>
      <span className="hs-coin hs-send" style={{ "--d": "1.7s" } as React.CSSProperties}>S</span>
      <div className="hs-card hs-payee hs-pop" style={{ "--d": "2.4s" } as React.CSSProperties}>
        <p className="hs-k">{tr(v, "Mpishi", "Caterer")}</p>
        <p className="hs-big">{v.mobileMoney ? ex(v, 598_500) : ex(v, 588_000)}</p>
        <p className="hs-ok">✓</p>
      </div>
      {[-1, 0, 1, 2].map((k, i) => (
        <span
          key={k}
          className="hs-note"
          style={{ "--d": `${3.1 + i * 0.22}s`, "--x": `${[-140, -48, 48, 140][i]}px`, "--y": `${[-96, -126, -126, -96][i]}px` } as React.CSSProperties}
        >
          {tr(v, "✓ Imeripotiwa", "✓ Reported")}
        </span>
      ))}
    </div>
  );
}

const SCENES = [SceneStart, SceneShare, SceneOut];

/**
 * "How it works" as a short film: three 3D scenes that play by themselves while the section is on
 * screen, with tabs that fill as each scene plays. Tap a tab to jump. Pauses off screen and in
 * background tabs; reduced motion shows each scene's final frame.
 */
export function HowShow({ v, steps }: { v: Visitor; steps: { title: string; line: string }[] }) {
  const STEPS = steps.map((s, k) => ({ ...s, n: NUMS[k] }));
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // Fit the scenes to the stage: they're laid out for ~540×380; smaller stages scale them down.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => el.style.setProperty("--hs-scale", String(Math.min(1, el.clientWidth / 540, el.clientHeight / 380)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting && !document.hidden), { threshold: 0.35 });
    io.observe(el);
    const vis = () => setOn(!document.hidden && el.getBoundingClientRect().top < innerHeight && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setI((v) => (v + 1) % NUMS.length), DURATION);
    return () => clearTimeout(t);
  }, [i, on]);

  const tilt = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !rig.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    rig.current.style.setProperty("--ry", `${-14 + x * 16}deg`);
    rig.current.style.setProperty("--rx", `${10 - y * 12}deg`);
  }, []);

  const Scene = SCENES[i];

  return (
    <div ref={root} className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14" data-playing={on ? "" : undefined}>
      <ol className="order-2 grid grid-cols-3 gap-2 lg:order-1 lg:grid-cols-1 lg:gap-3">
        {STEPS.map((s, k) => (
          <li key={s.n}>
            <button
              type="button"
              onClick={() => setI(k)}
              aria-current={k === i ? "step" : undefined}
              className={`hs-tab w-full text-left ${k === i ? "is-on" : ""}`}
            >
              <span className="font-mono text-xs text-marigold">{s.n}</span>
              <span className="font-display mt-1 block text-base font-semibold leading-tight sm:text-lg lg:text-2xl">{s.title}</span>
              <span className="mt-1 hidden text-sm text-paper/70 lg:block">{s.line}</span>
              <span className="hs-progress" aria-hidden>
                <span key={k === i ? `${i}-on` : `${k}-off`} style={{ animationDuration: `${DURATION}ms` }} />
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="order-1 lg:order-2" onPointerMove={tilt}>
        <div ref={stage} className="hs-stage" aria-live="polite">
          <p className="sr-only">{`${STEPS[i].title}. ${STEPS[i].line}`}</p>
          <div className="hs-floor" aria-hidden />
          <div ref={rig} className="hs-rig" aria-hidden>
            <Scene key={i} v={v} />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-paper/70 lg:hidden">{STEPS[i].line}</p>
      </div>
    </div>
  );
}
