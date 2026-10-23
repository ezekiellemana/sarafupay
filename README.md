# SarafuPay

Group collections (michango) for weddings, funerals, medical bills, school fees and community
groups, run from WhatsApp. Friends pay with mobile money or by card/PayPal from abroad; every payout needs the organiser's one-time code and is
reported to everyone who gave.

Live at **https://sarafupay.app** · by EPRIZE DIGITAL.

## How money moves

SarafuPay is the technology and record-keeping layer. Licensed providers hold and move the money:

| Rail | Contributors pay with | Payouts go to | Provider |
|---|---|---|---|
| TZS | Mobile money (all Tanzanian networks) | Mobile money or 40+ Tanzanian banks | [Snippe](https://snippe.sh) |
| USD | Card or PayPal | The organiser's PayPal account | [PayPal](https://www.paypal.com) |

The two balances are kept separately and never converted automatically.

## Pricing

Contributors pay exactly what they give; the organiser carries the fees. No monthly fee, no
minimum withdrawal. Defaults (editable at `/admin`):

| | Provider | SarafuPay | Total |
|---|---|---|---|
| Mobile money payment | Snippe 2.5% | 2.5% | 5% |
| Payout to mobile money or bank | Snippe TZS 1,500 | 2.5% | TZS 1,500 + 2.5% |
| Card or PayPal payment | PayPal 4.9% + $0.30 | 3% | 7.9% + $0.30 |
| Payout to PayPal | PayPal 2% (max $1) | 2% | up to 4% |

Provider fees are the providers' published prices (Snippe pricing page; PayPal Tanzania merchant
fees, 28 Sep 2026). When a provider reports the fee it really charged, that figure is used.
The math lives in `lib/pricing.ts` and is covered by `tests/pricing.test.ts`.

## Stack

Next.js 16 (App Router), TypeScript, Drizzle + Postgres (PGlite locally), Vercel AI SDK with
Gemini, WhatsApp Cloud API, Snippe REST API, PayPal Server SDK + Payouts, AG Studio treasurer
dashboard. Hosted on DigitalOcean App Platform (`.do/app.yaml`).

```
app/
  api/snippe/webhook    Snippe payments + payouts (HMAC-signed)
  api/paypal/webhook    PayPal captures, payouts, invoices
  api/whatsapp          WhatsApp webhook → AI agent
  api/cron/reconcile    15-min safety net for missed webhooks
  c/[code]              public collection page + checkout (mobile money or card)
  d/[code]              organiser's private dashboard
  pricing, admin        public prices; owner-only rate editor and earnings
lib/
  pricing.ts            fee engine (pure)
  snippe/client.ts      Snippe sessions, payouts, webhook verification
  paypal/               orders, payouts, toolkit
  services/core.ts      collections, contributions, balances, payouts
  agent/                prompt + tools for the WhatsApp agent
```

## Run locally

```bash
npm install
cp env.example .env.local   # fill what you need; empty DATABASE_URL uses embedded PGlite
npm run dev                 # http://localhost:3000, chat simulator at /chat
npm run test:pricing        # fee math
npm test                    # end-to-end flow with mocked providers
```

## Deploy

See [docs/DEPLOY_DIGITALOCEAN.md](docs/DEPLOY_DIGITALOCEAN.md).

## Safety rules in the code

- The AI never moves money. Payouts run only after the organiser's own phone sends
  `CONFIRM <code>`, a path that never goes through the language model.
- Webhooks from Snippe, PayPal and Meta are signature-verified and de-duplicated.
- A Snippe payment is only accepted if the amount matches the contribution exactly.
- Every transaction stores the provider, the fees and the rates it used.

## License

MIT
