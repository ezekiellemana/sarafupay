"use client";

import { useState } from "react";
import { AmountInput } from "./amount-input";
import { Mark, Provider, type ProviderName } from "@/components/provider";

type Method = "mobile_money" | "card_or_paypal";

const METHODS: { id: Method; title: string; sub: React.ReactNode; currency: string; via: ProviderName }[] = [
  { id: "mobile_money", title: "Mobile money", sub: "Any Tanzanian mobile money number", currency: "TZS", via: "Snippe" },
  { id: "card_or_paypal", title: "Card or PayPal", sub: (
      <span className="mt-1 flex items-center gap-2">
        <Mark name="Mastercard" height={16} />
        <Mark name="PayPal" height={16} />
      </span>
    ), currency: "USD", via: "PayPal" },
];

/** Payment method choice + amount + payer details. Submits `method`, `amount`, `phone`, `name`, `message`. */
export function ChipIn({ disabled, defaultMethod = "mobile_money" }: { disabled: boolean; defaultMethod?: Method }) {
  const [method, setMethod] = useState<Method>(defaultMethod);
  const m = METHODS.find((x) => x.id === method)!;
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium">How would you like to pay?</legend>
        <input type="hidden" name="method" value={method} />
        <div className="mt-1.5 grid gap-2" role="radiogroup">
          {METHODS.map((x) => {
            const on = x.id === method;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMethod(x.id)}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  on ? "border-forest bg-forest/5 ring-1 ring-forest" : "border-line bg-white hover:border-forest"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${on ? "border-forest" : "border-line"}`}
                >
                  {on ? <span className="h-2 w-2 rounded-full bg-forest" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold">{x.title}</span>
                    <span className="rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft">{x.currency}</span>
                  </span>
                  <span className="block text-xs text-ink-soft">{x.sub}</span>
                  <span className="mt-1 block text-[11px] text-ink-soft">
                    Processed by <Provider name={x.via} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Remount on method change so presets and decimals follow the currency. */}
      <AmountInput key={m.currency} currency={m.currency} via={m.via} />

      {method === "mobile_money" ? (
        <label className="block text-sm font-medium">
          Mobile money number <span className="font-normal text-ink-soft">(optional)</span>
          <input
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="0712 345 678"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-base"
          />
          <span className="mt-1 block text-xs font-normal text-ink-soft">You approve the payment on your phone. Never share your PIN.</span>
        </label>
      ) : null}

      <label className="block text-sm font-medium">
        Your name
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Only your first name is shown publicly"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-base"
        />
      </label>
      <label className="block text-sm font-medium">
        Message <span className="font-normal text-ink-soft">(optional)</span>
        <input name="message" maxLength={280} placeholder="Hongera! 🎉" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-base" />
      </label>
      <button disabled={disabled} className="btn btn-primary w-full justify-center disabled:opacity-50">
        {method === "mobile_money" ? "Continue to mobile money →" : <>Continue to <Provider name="PayPal" className="mx-1" /> →</>}
      </button>
      <p className="text-center text-xs text-ink-soft">Payment is processed by <Provider name={m.via} />. SarafuPay never sees your PIN or card.</p>
    </div>
  );
}
