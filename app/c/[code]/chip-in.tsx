"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AmountInput } from "./amount-input";
import { isTzMobile, PhoneInput } from "./phone-input";
import { PAYPAL_CURRENCIES } from "@/lib/currency";
import type { Copy } from "@/lib/copy";
import { Card, PhoneMoney } from "@/components/icons";

type Method = "mobile_money" | "card_or_paypal";


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
export function ChipIn({ disabled, t, cardFirst, cardCurrency }: { disabled: boolean; t: Copy["chip"]; cardFirst: boolean; cardCurrency: string }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  // The server picks the visitor's own currency (from their country) when PayPal supports it.
  const [cardCur, setCardCur] = useState(cardCurrency);
  const mm = { id: "mobile_money" as Method, title: t.mobile, icon: PhoneMoney };
  const cd = { id: "card_or_paypal" as Method, title: t.card, icon: Card };
  const METHODS = cardFirst ? [cd, mm] : [mm, cd];

  const currency = method === "mobile_money" ? "TZS" : cardCur;
  const ready = method !== "mobile_money" || isTzMobile(phone);

  return (
    <div className="space-y-4">
      <input type="hidden" name="method" value={method ?? ""} />
      <input type="hidden" name="currency" value={currency} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.how}>
        {METHODS.map((x) => {
          const on = x.id === method;
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setMethod(x.id)} className={`method-pick ${on ? "is-on" : ""}`}>
              <x.icon size={28} />
              <span className="font-semibold">{x.title}</span>
            </button>
          );
        })}
      </div>

      {method ? (
        <div key={method} className="chip-fields space-y-4">
          {method === "card_or_paypal" ? (
            <label className="block text-sm font-medium">
              {t.currency}
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
          <AmountInput key={currency} currency={currency} label={t.amount} />

          {method === "mobile_money" ? (
            <div>
              <p className="text-sm font-medium">{t.number}</p>
              <div className="mt-1.5">
                <PhoneInput name="phone" onChange={setPhone} label={t.number} />
              </div>
            </div>
          ) : null}

          <label className="block text-sm font-medium">
            {t.name}
            <input name="name" required maxLength={80} autoComplete="given-name" className="field mt-1.5" />
          </label>
          <label className="block text-sm font-medium">
            {t.message} <span className="font-normal text-ink-soft">{t.optional}</span>
            <input name="message" maxLength={280} placeholder={t.msgPh} className="field mt-1.5" />
          </label>
          <PayButton disabled={disabled || !ready} label={method === "mobile_money" ? t.payMobile : t.payCard} busy={method === "mobile_money" ? t.busyMobile : t.busyCard} />
        </div>
      ) : null}
    </div>
  );
}

/** The submit button, which says what is happening while the prompt is sent or the card form opens. */
function PayButton({ disabled, label, busy }: { disabled: boolean; label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={disabled || pending} aria-busy={pending} className="btn btn-primary w-full justify-center disabled:opacity-50">
      {pending ? busy : label}
    </button>
  );
}
