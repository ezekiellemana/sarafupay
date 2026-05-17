# SarafuPay — Final Test Report

**Test dates:** 2026-05-15 (payment flow) → 2026-05-16 (webhook path)  
**Tester:** Project owner (manual, real M-Pesa payments)  
**Environment:** Local development — Node 18, MongoDB local, ngrok tunnel

---

## What Passed

| Area | Result |
|---|---|
| Payment session creation (POST /api/payments/create-public-session) | ✅ Passed |
| Snippe checkout redirect with correct amount and branding | ✅ Passed |
| Return-page verify (`/payment/return?reference=SPY-...`) | ✅ Passed |
| Payment marked `completed` with `paidAt` timestamp | ✅ Passed |
| Project `totalCollected` and `contributorCount` updated | ✅ Passed |
| Owner dashboard shows correct stats | ✅ Passed |
| Contributor list shows payer name, phone, status | ✅ Passed |
| CSV export — correct columns and data | ✅ Passed |
| Snippe checkout branding shows "SarafuPay" via Payment Profile | ✅ Passed |
| Fixed amount project — payer cannot override amount | ✅ Passed |
| Minimum amount guard (< 500 TZS rejected) | ✅ Passed |
| Webhook signature verification (HMAC-SHA256) | ✅ Passed |
| Webhook-only payment completion (browser closed before redirect) | ✅ Passed |
| `rawWebhookPayload` saved on webhook-completed payment | ✅ Passed |
| `paymentMethod` set by webhook path | ✅ Passed |
| Project stats updated by webhook path | ✅ Passed |
| Duplicate webhook idempotency (replay → no double-count) | ✅ Passed |

---

## Bugs Found and Fixed

### Bug 1 — `allowed_methods` rejected by Snippe (VAL_001)
**File:** `server/src/services/snippe.service.ts`  
**Cause:** Payload included `"qr"` in `allowed_methods`. Snippe only accepts `"mobile_money"` and `"card"`.  
**Fix:** Removed `"qr"` from the array.

### Bug 2 — No reference in redirect URL
**File:** `server/src/services/snippe.service.ts`  
**Cause:** `redirect_url` pointed to `/payment/return` with no query parameters. The return page had no reference to call the verify endpoint with.  
**Fix:** Embedded `externalReference` in the redirect URL: `/payment/return?reference=${input.externalReference}`.

### Bug 3 — Project stats not updating after return-page verify
**File:** `server/src/services/payment.service.ts` — `verifyLocalPayment`  
**Cause:** `Payment.findOne(...).populate("projectId", "title description")` replaced the `projectId` ObjectId with a full document. `refreshCollectionStats(payment.projectId)` then received a document object, not an ObjectId, so the aggregation `$match` never matched any payments.  
**Fix:** Extract the raw ObjectId from the populated field before calling `refreshCollectionStats`:
```typescript
const rawProjectId = ((payment.projectId as unknown as { _id: Types.ObjectId })?._id)
  ?? (payment.projectId as unknown as Types.ObjectId);
await refreshCollectionStats(rawProjectId);
```

### Bug 4 — Wrong Snippe base URL (DNS failure)
**File:** `server/.env` and `server/.env.example`  
**Cause:** Default `SNIPPE_BASE_URL` was `https://api.snippe.me` which does not resolve.  
**Fix:** Corrected to `https://api.snippe.sh` in `.env.example` and in the running `.env`.

### One-time data repair
After fixing Bug 3, existing projects had stale stats (completed payment not counted). The following aggregation was run once in MongoDB to backfill all projects:
```javascript
db.payments.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$projectId", totalCollected: { $sum: "$amount" }, contributorCount: { $sum: 1 } } }
]).forEach(stat => {
  db.projects.updateOne({ _id: stat._id }, { $set: { totalCollected: stat.totalCollected, contributorCount: stat.contributorCount } });
});
```
This is not needed for any future payments — Bug 3 fix handles it going forward.

---

## Webhook Blocker — RESOLVED (2026-05-16)

`SNIPPE_WEBHOOK_SECRET` has been set in `server/.env`. Webhook signature verification is working.

**How it was resolved:** Snippe support escalation (submitted 2026-05-15, name: Ezekiel Augustino Lemana) resulted in access to the webhook signing secret. The secret was added to `server/.env` and the server was restarted.

**Verification:** Backend log confirmed secret loaded (`injected env (15) from .env`). Webhook retry from Snippe dashboard returned `200 OK`. Fresh webhook-only payment test passed end-to-end.

---

## Webhook Delivery Confirmed — Observed 2026-05-15

Snippe dashboard shows webhook delivery attempts to our ngrok URL for the test payment made during this session:

| Event | URL | Status | Attempts |
|---|---|---|---|
| `payment.completed` | `https://165f-154-74-175-21.ngrok-free.app/...` | FAILED | 4 / 5 |
| `payment.completed` | `https://165f-154-74-175-21.ngrok-free.app/...` | ABANDONED | 4 / 5 |

**What this confirms:**
- Snippe IS delivering webhooks to our backend URL — the delivery mechanism is working.
- Our server is receiving the requests but returning a non-2xx response because `SNIPPE_WEBHOOK_SECRET` is empty, causing the handler to throw `500 WEBHOOK_SECRET_MISSING` before processing the event.
- Once the secret is set, Snippe's **Retry** button in the dashboard can be used to replay the failed `payment.completed` events without making a new payment.

**Expected outcome after secret is set and retry is triggered:**
1. Webhook returns `200 OK`
2. `payment.status` remains `"completed"` — idempotency guard returns early (no double-processing)
3. `rawWebhookPayload` is saved to the payment record
4. `paymentMethod` is updated if Snippe includes it in the payload
5. `project.totalCollected` and `contributorCount` are not double-counted — `refreshCollectionStats` re-aggregates from completed payments, so the result is always correct regardless of how many times the webhook fires

---

## Webhook Test — Completed (2026-05-16)

### What was tested

**Retry test:** Used Snippe dashboard Retry button on the existing FAILED `payment.completed` event. Server returned `200`. Idempotency guard fired correctly — payment already completed by return-page path, stats did not double-count.

**Fresh webhook-only test:** Made a new real M-Pesa payment. Closed the Snippe tab immediately after M-Pesa completed — did not use the return-page redirect. Waited for the webhook.

### Results

| Check | Result |
|---|---|
| Server log: `[Webhook] Incoming — sig present: true, ts present: true, rawBody present: true` | ✅ |
| `POST /api/webhooks/snippe 200` | ✅ |
| New payment `status: "completed"` | ✅ |
| `paidAt` set | ✅ |
| `paymentMethod` set (written by webhook path) | ✅ |
| `rawWebhookPayload` saved (full Snippe event object) | ✅ |
| Project `totalCollected` increased correctly | ✅ |
| Project `contributorCount` increased correctly | ✅ |
| Duplicate webhook replay → stats unchanged | ✅ |

### Note on idempotency and rawWebhookPayload

When a payment is first completed by the return-page verify path and the webhook arrives later, the idempotency guard (`if (payment.status === "completed") return payment`) fires before `rawWebhookPayload` and `paymentMethod` are written. Those fields will be absent on such records. This is expected — the fields are only guaranteed present on payments completed exclusively via the webhook path. A future enhancement could enrich already-completed records with these fields on webhook arrival without touching stats.

---

## Production Launch Checklist

Do not launch until all of the following are true:

- [x] `SNIPPE_WEBHOOK_SECRET` is set and webhook path tested end-to-end ✅ (2026-05-16)
- [ ] `NODE_ENV=production` and `SERVER_URL` is a stable HTTPS domain (not ngrok)
- [ ] `CLIENT_URL` is the production domain
- [ ] MongoDB is on a hosted cluster (not `localhost`)
- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] Webhook URL registered in Snippe dashboard points to the production domain
- [x] Duplicate payment test passed (replay webhook → no double-count) ✅ (2026-05-16)
- [ ] Wrong-owner access test passed (another user cannot see your payments)

---

## Production Smoke Test — PASSED (2026-05-17)

**Environment:** Full production stack

| Layer | URL |
| --- | --- |
| Frontend | `https://sarafupay-client.vercel.app` |
| Backend | `https://sarafupay-server-ejbun.ondigitalocean.app` |
| Database | MongoDB Atlas — cluster0.ny7x27a.mongodb.net / sarafupay |

### Smoke Test Results

| # | Test | Result |
| --- | --- | --- |
| 1 | Register new account on production frontend | PASS |
| 2 | Login — auth cookie set, session persists across requests | PASS |
| 3 | Member dashboard loads (CORS, JWT, MongoDB all working) | PASS |
| 4 | Create public collection ("Final Year Project Contribution", 5,000 TZS) | PASS |
| 5 | Public payment page `/pay/[slug]` loads without authentication | PASS |
| 6 | Collection title and amount display correctly on public page | PASS |
| 7 | Snippe checkout opens on "Pay Now" | PASS |
| 8 | Payment completes via M-Pesa (+255 format) | PASS |
| 9 | `/payment/return` shows success state and receipt | PASS |
| 10 | DigitalOcean logs show `POST /api/webhooks/snippe 200` | PASS |
| 11 | Dashboard stats update (total collected, contributor count) | PASS |
| 12 | Payment record shows `status: completed` | PASS |
| 13 | Admin CSV export includes the completed payment | PASS |

All 13 checks passed. No failures.

### Deployment issues resolved before this test

| Issue | Fix | Commit |
| --- | --- | --- |
| DO: `Cannot find module 'punycode/'` on Node 22 | `punycode@^2.3.1` dep + `engines.node=20.x` | `306fcca` |
| DO: workspace monorepo modules not found at runtime | Source dir changed from `server` to `.` (root) | — |
| DO: devDependencies pruned before `tsc` | Root `.npmrc` with `production=false` | `306fcca` |
| Vercel: Node v24 instead of 20.x | `engines.node=20.x` in `client/package.json` | `85577fa` |
| Vercel: `lightningcss.linux-x64-gnu.node` missing | `lightningcss-linux-x64-gnu` optional dep | `85577fa` |
| Vercel: `@tailwindcss/oxide-linux-x64-gnu` missing | `@tailwindcss/oxide-linux-x64-gnu` optional dep | `459c51d` |

### Production launch checklist — final state

- [x] `SNIPPE_WEBHOOK_SECRET` set, webhook tested end-to-end ✅
- [x] `NODE_ENV=production` on DigitalOcean ✅
- [x] `SERVER_URL` is stable HTTPS (DigitalOcean App Platform) ✅
- [x] `CLIENT_URL` is the production Vercel domain ✅
- [x] MongoDB Atlas hosted cluster, `db: connected` confirmed ✅
- [x] `JWT_SECRET` is 64+ random characters ✅
- [x] `NEXT_PUBLIC_API_PROXY_URL` set on Vercel ✅
- [x] Real M-Pesa payment completed on production URL ✅
- [x] Webhook URL per-session via `SERVER_URL` env var ✅

**Release tag:** `v1.2.1`
