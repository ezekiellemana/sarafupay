"use client";

import { useEffect, useState } from "react";
import { AmountInput } from "./amount-input";
import { isTzMobile, PhoneInput } from "./phone-input";
import { currencyForLocale, PAYPAL_CURRENCIES } from "@/lib/currency";

type Method = "mobile_money" | "card_or_paypal";

const METHODS: { id: Method; title: string; icon: string }[] = [
  { id: "mobile_money", title: "Mobile money", icon: "📱" },
  { id: "card_or_paypal", title: "Card", icon: "💳" },
];

const currencyName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * Pick a way to pay, then the right fields open. Mobile money is in TZS with the phone number;
 * card is in the payer's own currency (preselected from their browser), converted by PayPal.
 * Submits `method`, `currency`, `amount`, `phone`, `name`, `message`.
 */
export function ChipIn({ disabled }: { disabled: boolean }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  const [cardCur, setCardCur] = useState("USD");
  useEffect(() => {
    // After mount, so the server and first client render agree.
    const t = setTimeout(() => setCardCur(currencyForLocale(navigator.language)), 0);
    return () => clearTimeout(t);
  }, []);

  const currency = method === "mobile_money" ? "TZS" : cardCur;
  const ready = method !== "mobile_money" || isTzMobile(phone);

  return (
    <div className="space-y-4">
      <input type="hidden" name="method" value={method ?? ""} />
      <input type="hidden" name="currency" value={currency} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How would you like to pay?">
        {METHODS.map((x) => {
          const on = x.id === method;
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setMethod(x.id)} className={`method-pick ${on ? "is-on" : ""}`}>
              <span className="text-2xl" aria-hidden>{x.icon}</span>
              <span className="font-semibold">{x.title}</span>
            </button>
          );
        })}
      </div>

      {method ? (
        <div key={method} className="chip-fields space-y-4">
          {method === "card_or_paypal" ? (
            <label className="block text-sm font-medium">
              Currency
              <select value={cardCur} onChange={(e) => setCardCur(e.target.value)} className="field mt-1.5">
                {PAYPAL_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} · {currencyName(c)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {/* Remount on currency change so the symbol and decimals follow it. */}
          <AmountInput key={currency} currency={currency} />

          {method === "mobile_money" ? (
            <div>
              <p className="text-sm font-medium">Mobile money number</p>
              <div className="mt-1.5">
                <PhoneInput name="phone" onChange={setPhone} />
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
          <button disabled={disabled || !ready} className="btn btn-primary w-full justify-center disabled:opacity-50">
            {method === "mobile_money" ? "Pay with mobile money →" : "Pay by card →"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
