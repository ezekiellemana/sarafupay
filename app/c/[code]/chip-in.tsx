"use client";

import { useState } from "react";
import { AmountInput } from "./amount-input";
import { isTzMobile, PhoneDigits } from "./phone-digits";

type Method = "mobile_money" | "card_or_paypal";

const METHODS: { id: Method; title: string; icon: string; currency: string }[] = [
  { id: "mobile_money", title: "Mobile money", icon: "📱", currency: "TZS" },
  { id: "card_or_paypal", title: "Card", icon: "💳", currency: "USD" },
];

/**
 * Pick a way to pay, then the right fields open: amount, the mobile money number (mobile money
 * only), name and an optional message. Submits `method`, `amount`, `phone`, `name`, `message`.
 */
export function ChipIn({ disabled }: { disabled: boolean }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  const m = METHODS.find((x) => x.id === method);
  const phoneOk = method !== "mobile_money" || isTzMobile(phone);

  return (
    <div className="space-y-4">
      <input type="hidden" name="method" value={method ?? ""} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How would you like to pay?">
        {METHODS.map((x) => {
          const on = x.id === method;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMethod(x.id)}
              className={`method-pick ${on ? "is-on" : ""}`}
            >
              <span className="text-2xl" aria-hidden>{x.icon}</span>
              <span className="font-semibold">{x.title}</span>
              <span className="font-mono text-[11px] text-ink-soft">{x.currency}</span>
            </button>
          );
        })}
      </div>

      {m ? (
        <div key={m.id} className="chip-fields space-y-4">
          {/* Remount on method change so decimals follow the currency. */}
          <AmountInput currency={m.currency} />

          {method === "mobile_money" ? (
            <div>
              <p className="text-sm font-medium">Mobile money number</p>
              <div className="mt-1.5">
                <PhoneDigits name="phone" onChange={setPhone} />
              </div>
            </div>
          ) : null}

          <label className="block text-sm font-medium">
            Your name
            <input name="name" required maxLength={80} autoComplete="given-name" className="field mt-1.5" />
          </label>
          <label className="block text-sm font-medium">
            Message <span className="font-normal text-ink-soft">(optional)</span>
            <input name="message" maxLength={280} placeholder="Hongera! 🎉" className="field mt-1.5" />
          </label>
          <button disabled={disabled || !phoneOk} className="btn btn-primary w-full justify-center disabled:opacity-50">
            {method === "mobile_money" ? "Pay with mobile money →" : "Pay by card →"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
