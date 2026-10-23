"use client";

import { useRef, useState } from "react";

const LEN = 10;
const HINT = "0712345678";

/** Turns "+255 712 345 678", "255712345678" or "0712 345 678" into ten digits starting with 0. */
function toLocal(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("255")) d = "0" + d.slice(3);
  else if (d.length === 9 && /^[67]/.test(d)) d = "0" + d;
  return d.slice(0, LEN);
}

export const isTzMobile = (v: string) => /^0[67]\d{8}$/.test(v);

/**
 * A Tanzanian mobile number as ten single-digit boxes (07XX XXX XXX). Typing moves forward,
 * backspace moves back, and pasting or autofilling a whole number spreads it across the boxes.
 * Submits the joined number as `name`.
 */
export function PhoneDigits({ name, onChange }: { name: string; onChange?: (value: string) => void }) {
  const [digits, setDigits] = useState<string[]>(() => Array(LEN).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const commit = (next: string[], focus?: number) => {
    setDigits(next);
    onChange?.(next.join(""));
    // Move focus now, not on the next frame, so fast typing never lands in the wrong box.
    if (focus !== undefined) boxes.current[Math.min(LEN - 1, focus)]?.focus();
  };

  const fill = (from: number, raw: string) => {
    const incoming = from === 0 || raw.replace(/\D/g, "").length > LEN - from ? toLocal(raw) : raw.replace(/\D/g, "");
    const start = incoming.length >= LEN ? 0 : from;
    const next = [...digits];
    for (let k = 0; k < incoming.length && start + k < LEN; k++) next[start + k] = incoming[k];
    commit(next, start + incoming.length);
  };

  const onInput = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    // Several digits at once is a paste or autofill; two means a digit typed over a filled box.
    if (v.length > 2) return fill(i, e.target.value);
    const next = [...digits];
    next[i] = v.slice(-1);
    return commit(next, v ? i + 1 : undefined);
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      commit(next, i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus();
  };

  return (
    <div>
      <input type="hidden" name={name} value={digits.join("")} />
      <div className="phone-digits" role="group" aria-label="Mobile money number">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            onChange={(e) => onInput(i, e)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={(e) => {
              e.preventDefault();
              fill(i, e.clipboardData.getData("text"));
            }}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? "tel-national" : "off"}
            maxLength={i === 0 ? 16 : 2}
            placeholder={HINT[i]}
            aria-label={`Digit ${i + 1}`}
            className={`digit ${i === 3 || i === 6 ? "gap-before" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
