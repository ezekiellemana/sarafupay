# SarafuPay — Real Payment Testing Guide

## 1. Required Environment Variables

### Server — `server/.env`

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | Yes | `development` |
| `PORT` | No | Default: `5000` |
| `MONGO_URI` | **Yes** | `mongodb://127.0.0.1:27017/sarafupay` |
| `JWT_SECRET` | **Yes** | Min 32 random characters |
| `JWT_EXPIRES_IN` | No | Default: `7d` |
| `COOKIE_NAME` | No | Default: `sarafupay_token` |
| `CLIENT_URL` | **Yes** | `http://localhost:3000` |
| `SERVER_URL` | **Yes — ngrok URL** | `https://xxxx.ngrok-free.app` |
| `SNIPPE_API_KEY` | **Yes** | From Snippe dashboard |
| `SNIPPE_WEBHOOK_SECRET` | **Yes** | From Snippe dashboard |
| `SNIPPE_BASE_URL` | No | Default: `https://api.snippe.me` |
| `ADMIN_EMAIL` | No | Seeded admin email |
| `ADMIN_PASSWORD` | No | Seeded admin password |
| `ADMIN_NAME` | No | Seeded admin name |
| `ADMIN_PHONE` | No | Seeded admin phone |

> `SERVER_URL` must be your ngrok public HTTPS URL. Snippe calls your webhook from the internet and cannot reach `localhost`. Update this every time ngrok restarts.

### Client — `client/.env.local`

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Leave empty — Next.js rewrites handle routing |
| `NEXT_PUBLIC_API_PROXY_URL` | No | Default: `http://127.0.0.1:5000` |

> The Snippe API key is never in the client. All calls to Snippe go through the Express server only.

### Example `server/.env`

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
SERVER_URL=https://YOUR-NGROK-URL.ngrok-free.app
MONGO_URI=mongodb://127.0.0.1:27017/sarafupay
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=7d
COOKIE_NAME=sarafupay_token
SNIPPE_API_KEY=your_snippe_api_key
SNIPPE_WEBHOOK_SECRET=your_snippe_webhook_secret
SNIPPE_BASE_URL=https://api.snippe.me
ADMIN_NAME=SarafuPay Admin
ADMIN_EMAIL=admin@sarafupay.test
ADMIN_PHONE=+255700000000
ADMIN_PASSWORD=ChangeMe123!
```

---

## 2. Local Testing Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally
- ngrok installed (`ngrok version` to confirm)
- A real phone number that can receive M-Pesa prompts
- Snippe account with API key and webhook secret

### Start ngrok

```powershell
ngrok http 5000
```

Copy the `https://` URL (e.g. `https://abc123.ngrok-free.app`) and set it as `SERVER_URL` in `server/.env`.

### Start the server

```powershell
npm --workspace server run dev
```

Confirm output: `SarafuPay API running on port 5000`

Health check: `http://localhost:5000/health`

### (Optional) Seed admin user

```powershell
npm --workspace server run seed
```

### Start the client

```powershell
npm --workspace client run dev
```

App available at `http://localhost:3000`

### Snippe Dashboard Settings

Set these once (update webhook URL whenever ngrok URL changes):

| Field | Value |
|---|---|
| Webhook URL | `https://YOUR-NGROK.ngrok-free.app/api/webhooks/snippe` |
| Redirect / Return URL | `http://localhost:3000/payment/return` |
| Webhook events | `payment.completed`, `payment.failed`, `payment.expired`, `payment.cancelled` |

After registering the webhook, copy the generated secret into `SNIPPE_WEBHOOK_SECRET` and restart the server.

> **Production blocker:** `SNIPPE_WEBHOOK_SECRET` must be set before going live. The return-page verify path (`/payment/return`) works for local testing when the webhook secret is missing, but webhooks are the only reliable completion path for payments where the browser never redirects back. Do not launch until the webhook path is tested end-to-end with a real secret.

---

## 3. Local URLs

| URL | Purpose |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/register` | Create account |
| `http://localhost:3000/login` | Login |
| `http://localhost:3000/dashboard` | Owner dashboard |
| `http://localhost:3000/dashboard/collections` | My projects list |
| `http://localhost:3000/dashboard/collections/new` | Create project |
| `http://localhost:3000/dashboard/collections/{id}` | Project detail + contributor list + CSV export |
| `http://localhost:3000/pay/{slug}` | Public payment link (test in incognito) |
| `http://localhost:3000/payment/return` | Post-checkout landing page |
| `http://localhost:5000/health` | Server health check |

---

## 4. Test Flows

### Flow A — Fixed Amount Project

1. Register a new user at `/register` and login.
2. Go to **My Projects → Create Project**.
3. Fill in:
   - Title: `Test Wedding Fund`
   - Type: `Wedding`
   - Suggested Amount: `5000` (minimum accepted by Snippe is 500 TZS)
   - Currency: `TZS`
   - Allow Custom Amount: **unchecked**
   - Visibility: `Public`
4. Submit → copy the generated payment link (`/pay/test-wedding-fund`).
5. Open the link in a new **incognito** window (no login needed).
6. Confirm: fixed amount `5,000 TZS` is displayed — no amount input shown.
7. Enter payer name and M-Pesa phone number, optional email.
   - On the Snippe checkout phone field: select **Tanzania (+255)** from the country dropdown, then enter the number **without the leading zero** (e.g. `752772587` not `0752772587`).
8. Click **Pay Now →**.
9. Confirm redirect to Snippe checkout with correct amount.
10. Complete M-Pesa payment.
11. Confirm redirect to `/payment/return` showing "Payment completed!".
12. Login as owner → open the project detail page.
13. Confirm: `totalCollected` updated, `contributorCount` = 1, payer appears in contributor list.

### Flow B — Custom Amount Project

1. Create another project:
   - Type: `Charity`
   - Suggested Amount: `2000`
   - Allow Custom Amount: **checked**
   - Minimum Amount: `500`
2. Open its payment link in incognito.
3. Confirm: quick-select buttons show `2,000 / 4,000 / 10,000 TZS`.
4. Try entering `300` — confirm error: "Minimum contribution is 500 TZS".
5. Enter `1500` and pay → Snippe shows `1,500 TZS`.
6. Complete payment and verify the same return and dashboard update.

### Flow C — Paused Project

1. In MongoDB Compass (or shell), set a project's `status` field to `"paused"`.
2. Open its `/pay/[slug]` link.
3. Confirm: collection info is visible but the payment form is replaced with a **"Temporarily paused"** card. No submit button visible.

---

## 5. Database Checks

Database name: `sarafupay`

### `users` collection

After registration:
```javascript
db.users.findOne({ email: "your@email.com" })
```
Expected: `role: "member"`, `isActive: true`

### `projects` collection

After creating a project:
```javascript
db.projects.findOne({ title: "Test Wedding Fund" })
```

| Field | Expected value |
|---|---|
| `slug` | `"test-wedding-fund"` |
| `publicPaymentLink` | `"http://localhost:3000/pay/test-wedding-fund"` |
| `status` | `"active"` |
| `visibility` | `"public"` |
| `allowCustomAmount` | `false` |
| `suggestedAmount` | `5000` |
| `totalCollected` | `0` (before payment) → amount after webhook |
| `contributorCount` | `0` (before payment) → `1` after webhook |

### `payments` collection

Find the most recent payment:
```javascript
db.payments.find().sort({ createdAt: -1 }).limit(1)
```

**Immediately after form submit (before Snippe checkout complete):**

| Field | Expected value |
|---|---|
| `status` | `"pending"` |
| `amount` | payment amount |
| `customerName` | payer's name |
| `customerPhone` | payer's phone |
| `snippeReference` | Snippe session reference |
| `snippeCheckoutUrl` | full Snippe URL |
| `externalReference` | starts with `SPY-` |
| `paidAt` | absent |
| `paymentMethod` | absent |

**After webhook fires and payment completes:**

| Field | Expected value |
|---|---|
| `status` | `"completed"` |
| `paidAt` | timestamp |
| `paymentMethod` | `"mobile_money"` |
| `rawWebhookPayload` | full Snippe webhook JSON object |

---

## 6. Failure Testing

### Failed Payment
Cancel or use an invalid PIN on the Snippe checkout. Snippe fires `payment.failed`.

- `status` → `"failed"`
- `totalCollected` on the project unchanged (stats only update on `"completed"`)

### Expired Payment
Leave the Snippe checkout idle until it times out.

- `status` → `"expired"`

### Duplicate Webhook
In the Snippe dashboard, replay/resend the same completed webhook event.

- `status` stays `"completed"` — the handler returns early when `status === "completed"`
- `totalCollected` does not double-count

### Wrong Owner Access
With a second user account, call the API directly:
```
GET http://localhost:5000/api/collections/{owner-a-collection-id}/payments
```
with the second user's session cookie. Expected: `404 COLLECTION_NOT_FOUND`.

### Amount Below Minimum
POST directly to the API with an amount below the minimum:
```json
POST /api/payments/create-public-session
{
  "collectionSlug": "charity-drive",
  "payerName": "Test User",
  "payerPhone": "0700000000",
  "amount": 100
}
```
Expected: `400 AMOUNT_TOO_LOW` — "Minimum contribution is 500 TZS"

### Fixed Amount Override Attempt
On an `allowCustomAmount: false` project, POST with any amount — the backend ignores it and uses `project.suggestedAmount`. The payer cannot override the fixed price.

---

## 7. CSV Export

1. Open a project that has completed payments.
2. Click **Export CSV** or **Export List** in the project detail page.
3. Open the downloaded file and verify columns: `Date`, `Payer Name`, `Phone`, `Email`, `Amount`, `Currency`, `Status`, `Method`, `Reference`, `Message`.
4. Confirm all completed and pending payments appear.
5. Confirm payer names with commas or quotes do not break CSV formatting.

---

## 8. Security Checklist

| Check | How it is enforced |
|---|---|
| Snippe API key never reaches browser | `SNIPPE_API_KEY` only in `server/.env`; client has no `NEXT_PUBLIC_SNIPPE_*` variable |
| All Snippe API calls are server-side | `snippe.service.ts` runs in Express only |
| Webhook signature verified | HMAC-SHA256 with timing-safe compare; rejects events older than 300 seconds |
| Payment not marked completed from redirect | `/payment/return` calls `GET /verify/:ref` which only reads status — the webhook is the only writer of `"completed"` |
| Only owner sees contributor list | `getCollectionPayments` queries `{ projectId, ownerId: req.user._id }` |
| Only owner/admin can export CSV | `exportCollectionCsvHandler` guards with `{ _id, ownerId: req.user._id }` under `protect` middleware |
| Admin routes fully isolated | `requireAdmin` middleware blocks any non-admin role at the router level |
| Duplicate payment blocked | Unique MongoDB index on `externalReference`; webhook guard returns early on `status === "completed"` |
| Public rate limiting | 15 req/10 min on payment session creation; 120 req/15 min on public collection lookup |
| Webhook secret required | Server throws `500 WEBHOOK_SECRET_MISSING` if `SNIPPE_WEBHOOK_SECRET` is not set |

---

## 9. Important Manual Steps

These cannot be automated — you must do them before each test session:

1. **Get Snippe credentials** from your Snippe dashboard and fill `server/.env`.
2. **Start ngrok** and copy the new HTTPS URL into `SERVER_URL` in `server/.env`.
3. **Update the webhook URL** in the Snippe dashboard to the new ngrok URL.
4. **Restart the server** after any `.env` change (the server reads `.env` at startup).
5. **Use a real phone number** that can receive M-Pesa prompts for the payment step.
6. **Free ngrok generates a new URL each session** — repeat steps 2–4 every time you restart ngrok. A paid ngrok plan with a fixed subdomain (`ngrok http 5000 --subdomain=sarafupay`) avoids this.
