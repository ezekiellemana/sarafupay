# SarafuPay — Quick Test Checklist

Run through this before and during every real Snippe payment test session.

---

## Before You Start

- [ ] MongoDB is running
- [ ] `server/.env` has `SNIPPE_API_KEY` and `SNIPPE_WEBHOOK_SECRET` filled in
- [ ] Run `ngrok http 5000` — copy the HTTPS URL
- [ ] Set `SERVER_URL=https://YOUR-NGROK-URL.ngrok-free.app` in `server/.env`
- [ ] Update webhook URL in Snippe dashboard to match new ngrok URL
- [ ] Confirm `SNIPPE_WEBHOOK_SECRET` is set in `server/.env` (**required before production** — leave empty only for local testing)
- [ ] Start server: `npm --workspace server run dev`
- [ ] Start client: `npm --workspace client run dev`
- [ ] Confirm server is live: open `http://localhost:5000/health`

---

## Account & Project Setup

- [ ] Register a new account at `http://localhost:3000/register`
- [ ] Login and confirm dashboard loads
- [ ] Create a **fixed-amount** project (allow custom amount = OFF, amount = 500 TZS minimum — Snippe rejects below 500)
- [ ] Create a **custom-amount** project (allow custom amount = ON, minimum = 500 TZS)
- [ ] Confirm each project shows a payment link in the format `/pay/[slug]`

---

## Fixed Amount Payment Flow

- [ ] Open `/pay/[slug]` in a new **incognito** window (no login)
- [ ] Confirm fixed amount is shown — no input field for amount
- [ ] Enter name + real M-Pesa phone + optional email
  - On Snippe checkout: select **Tanzania (+255)**, enter number **without leading zero** (e.g. `752772587`)
- [ ] Click Pay Now → confirm redirect to Snippe checkout
- [ ] Complete M-Pesa payment
- [ ] Confirm redirect back to `/payment/return?reference=SPY-...` — page shows "Payment completed!"
  - ⚠️ Return-page verify works for local testing. Webhook path must be tested before launch.
- [ ] Login as owner → open project detail → confirm `totalCollected` and `contributorCount` updated
- [ ] Confirm payer appears in the contributor list

---

## Custom Amount Payment Flow

- [ ] Open custom-amount project's `/pay/[slug]` in incognito
- [ ] Confirm quick-select amount buttons are visible
- [ ] Try amount below minimum — confirm error message appears
- [ ] Enter a valid custom amount → pay → confirm same return flow

---

## Paused Project

- [ ] Set a project `status` to `"paused"` in MongoDB
- [ ] Open its `/pay/[slug]` — confirm "Temporarily paused" card appears, NO payment form

---

## Export CSV

- [ ] Open a project with at least one completed payment
- [ ] Click Export CSV — confirm file downloads
- [ ] Open file — confirm columns: Date, Payer Name, Phone, Email, Amount, Currency, Status, Method, Reference, Message

---

## Failure & Edge Cases

- [ ] Cancel a payment on Snippe — confirm DB status changes to `"failed"`, dashboard unchanged
- [ ] Replay a completed webhook from Snippe dashboard — confirm no duplicate in payments, `totalCollected` unchanged
- [ ] Try `/pay/[slug]` on a closed collection — confirm "Collection not found" page

---

## Security Spot-Checks

- [ ] Open browser DevTools → Network tab → confirm no response ever contains `SNIPPE_API_KEY`
- [ ] Try accessing another user's project payments via API with your own cookie — confirm `404`
- [ ] Confirm `/api/admin/*` returns `403` when logged in as a normal user

---

## MongoDB Quick Checks

After a completed payment, run in Mongo shell or Compass:

```javascript
// Payment should be completed
db.payments.findOne({ status: "completed" })

// Project stats should be updated
db.projects.findOne({ slug: "your-slug" }, { totalCollected: 1, contributorCount: 1 })
```

Expected:
- `payment.status` = `"completed"`
- `payment.paidAt` = timestamp
- `payment.paymentMethod` = `"mobile_money"`
- `project.totalCollected` = payment amount
- `project.contributorCount` = 1

---

> Full details in [TESTING.md](./TESTING.md)
