"use client";

import { useState } from "react";

/** Ten local digits ("0712345678") from anything typed or pasted: "+255 712…", "255712…", "712…". */
export function toLocal(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("255")) d = "0" + d.slice(3);
  else if (d.length >= 9 && /^[67]/.test(d)) d = "0" + d;
  return d.slice(0, 10);
}

export const isTzMobile = (v: string) => /^0[67]\d{8}$/.test(toLocal(v));

/** "0712345678" → "0712 345 678", growing as digits arrive. */
function pretty(local: string): string {
  return [local.slice(0, 4), local.slice(4, 7), local.slice(7, 10)].filter(Boolean).join(" ");
}

/**
 * One phone field that arranges the number as it is typed (0712 345 678). Accepts +255 / 255
 * forms and pasted numbers. Submits the ten local digits as `name`.
 */
export function PhoneInput({ name, onChange }: { name: string; onChange?: (local: string) => void }) {
  const [shown, setShown] = useState("");
  const local = toLocal(shown);
  const done = /^0[67]\d{8}$/.test(local);

  return (
    <div className={`phone-field ${done ? "is-done" : ""}`}>
      <span className="phone-flag" aria-hidden>🇹🇿</span>
      <input
        value={shown}
        onChange={(e) => {
          const next = toLocal(e.target.value);
          setShown(pretty(next));
          onChange?.(next);
        }}
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="0712 345 678"
        aria-label="Mobile money number"
        className="min-w-0 flex-1 bg-transparent py-3 font-mono text-lg tracking-wider outline-none"
      />
      {done ? <span className="phone-ok" aria-hidden>✓</span> : null}
      <input type="hidden" name={name} value={local} />
    </div>
  );
}
