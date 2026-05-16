# SarafuPay — Production Deployment Guide

This guide walks you through deploying SarafuPay as a solo developer using three managed services that require no server administration.

---

## Recommended Stack

| Layer | Service | Why |
|---|---|---|
| Frontend | **Vercel** | Zero-config Next.js deployment, free tier, auto-deploys from GitHub |
| Backend | **DigitalOcean App Platform** | Managed Node.js, auto TLS, env var injection, ~$12/mo |
| Database | **MongoDB Atlas** | Managed MongoDB, free M0 tier to start |

### How they connect

```
User's browser
    │
    ▼
Vercel — your-domain.com
    │  /api/* requests are rewritten to backend
    ▼
DigitalOcean App Platform — api.your-domain.com
    │
    ▼
MongoDB Atlas — cloud database
```

The Next.js rewrite means the browser only ever talks to Vercel. All backend API calls are proxied server-side, keeping your Snippe API key and JWT cookies secure.

---

## Before You Start

You will need:
- A [GitHub](https://github.com) account with this repo pushed to it
- A [Vercel](https://vercel.com) account (free)
- A [DigitalOcean](https://cloud.digitalocean.com) account (~$12/mo)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free M0 tier)
- A domain name (optional but strongly recommended for production)
- Your Snippe API key and Payment Profile ID

> **Do not launch until `SNIPPE_WEBHOOK_SECRET` is set and the webhook test passes.** Without it, the server will not start in `NODE_ENV=production`. In development, these vars are optional — payment creation will fail with a clear 503 error if they are missing, rather than crashing the server.

---

## Step 1 — Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Click **Create a Deployment** → choose **M0 Free** → select a region close to your users → click **Create**.
3. **Create a database user:**
   - Go to **Security → Database Access → Add New Database User**
   - Authentication method: **Password**
   - Username: `sarafupay`
   - Password: click **Autogenerate Secure Password** → copy and save it somewhere safe
   - Role: **Atlas Admin** (or "Read and write to any database")
   - Click **Add User**
4. **Allow network access:**
   - Go to **Security → Network Access → Add IP Address**
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Click **Confirm**
   - *(You can restrict this to DigitalOcean IPs later for extra security)*
5. **Get your connection string:**
   - Go to **Database → Connect → Drivers**
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://sarafupay:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user's password
   - Add the database name before the `?`: change `mongodb.net/` to `mongodb.net/sarafupay`
   - Final result:
     ```
     mongodb+srv://sarafupay:YOURPASSWORD@cluster0.xxxxx.mongodb.net/sarafupay?retryWrites=true&w=majority
     ```
   - Save this — it is your `MONGO_URI`.

---

## Step 2 — Deploy the Backend to DigitalOcean App Platform

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) → click **Create App**.
2. Select **GitHub** → authorize DigitalOcean → choose your SarafuPay repo and the `main` branch.
3. DigitalOcean will scan the repo. When it shows the detected component:
   - Click **Edit** on the component
   - **Source directory:** `server`
   - **Build command:** `npm install && npm run build`
   - **Run command:** `npm start`
   - **HTTP port:** `5000`
   - Click **Save**
4. Click **Next** and skip to **Environment Variables** — add all the backend variables from the table below.
5. Choose a plan: **Basic → $12/mo** is sufficient for MVP.
6. Click **Create Resources** and wait for the first deploy to finish.
7. Once live, note your app URL — it looks like `https://sarafupay-api-xxxxx.ondigitalocean.app`.
8. **(Recommended) Add a custom domain:**
   - Go to **Settings → Domains → Add Domain**
   - Enter `api.your-domain.com`
   - DigitalOcean will give you DNS records to add to your registrar
   - TLS is provisioned automatically once DNS propagates

### Verify the backend is running

Open this URL in your browser (replace with your actual URL):
```
https://sarafupay-api-xxxxx.ondigitalocean.app/health
```

Expected response:
```json
{"success":true,"message":"SarafuPay API is healthy.","data":{"service":"sarafupay-api"}}
```

If you see this, the backend is working.

---

## Step 3 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → click **Add New → Project**.
2. Import your GitHub repo.
3. On the configuration screen:
   - **Root Directory:** click **Edit** → type `client` → click **Continue**
   - Framework preset: **Next.js** (auto-detected)
4. Add frontend environment variables from the table below.
5. Click **Deploy** and wait for it to finish.
6. Once live, note your URL: `https://sarafupay.vercel.app`.
7. **(Recommended) Add a custom domain:**
   - Go to **Settings → Domains → Add**
   - Enter `your-domain.com`
   - Follow Vercel's instructions to add DNS records at your registrar

---

## Environment Variables

### Backend (DigitalOcean App Platform)

Add these in **App Platform → your app → Settings → Environment Variables**.

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | **Required.** Enables secure cookies, production logging, removes stack traces from errors. |
| `PORT` | `5000` | Must match the HTTP port you set in App Platform. |
| `MONGO_URI` | `mongodb+srv://sarafupay:...` | Your full Atlas connection string including `/sarafupay` database name. |
| `JWT_SECRET` | 64+ random characters | Use a password generator. Never reuse a dev secret. |
| `JWT_EXPIRES_IN` | `7d` | How long login sessions last. |
| `COOKIE_NAME` | `sarafupay_token` | Can leave as-is. |
| `CLIENT_URL` | `https://your-domain.com` | Your Vercel frontend URL. **No trailing slash.** Must be exact. |
| `SERVER_URL` | `https://api.your-domain.com` | Your DigitalOcean backend URL. **No trailing slash. Must be HTTPS.** |
| `SNIPPE_API_KEY` | From Snippe dashboard | **Required in production — server will not start without this.** Never expose in the frontend. |
| `SNIPPE_WEBHOOK_SECRET` | From Snippe dashboard | **Required in production — server will not start without this.** Copy from Snippe dashboard → Settings → Webhook Secret. |
| `SNIPPE_BASE_URL` | `https://api.snippe.sh` | Do not change. |
| `SNIPPE_PROFILE_ID` | Your profile ID | Sets SarafuPay branding on the Snippe checkout page. |
| `ADMIN_NAME` | Your name | Used by the seed script. |
| `ADMIN_EMAIL` | admin@your-domain.com | Admin login email. |
| `ADMIN_PHONE` | +255700000000 | Admin phone number. |
| `ADMIN_PASSWORD` | Strong password | Change this immediately after first login. |

> ⚠️ **`CLIENT_URL` warning:** This must exactly match the origin your browser uses to open the app. If the browser loads `https://your-domain.com` but `CLIENT_URL` is `https://your-domain.com/` (with a trailing slash) or `https://www.your-domain.com` (with www), the server will reject all API requests with a CORS error.

> ⚠️ **`NODE_ENV` warning:** If this is missing or set to anything other than `production`, auth cookies will use `secure: false` and `sameSite: lax`, which will not work when the frontend and backend are on different domains. Login will appear to work but the session cookie will not be sent on subsequent requests.

### Frontend (Vercel)

Add these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_PROXY_URL` | `https://api.your-domain.com` | Your backend HTTPS URL. **No trailing slash.** This tells Next.js where to proxy `/api/*` requests. |

> ⚠️ **`NEXT_PUBLIC_API_PROXY_URL` warning:** If this is not set on Vercel, Next.js falls back to `http://127.0.0.1:5000`, which does not exist on Vercel's servers. Every API call — login, payment, dashboard — will return a 502 error.

### Snippe Configuration

After the backend is live, update your Snippe dashboard settings:

| Field | Value |
|---|---|
| Webhook URL | `https://api.your-domain.com/api/webhooks/snippe` |
| Webhook events | `payment.completed`, `payment.failed`, `payment.expired`, `payment.cancelled` |
| Redirect / Return URL | `https://your-domain.com/payment/return` |

Copy the webhook signing secret from **Snippe Dashboard → Settings → Webhook Secret** and set it as `SNIPPE_WEBHOOK_SECRET` in App Platform. Then redeploy the backend.

---

## Step 4 — Seed the Admin User (Once)

After the backend is live, create the admin account once using the seed script. The easiest way is to run it from your local machine pointed at the production database:

```powershell
# In PowerShell, from the project root:
$env:NODE_ENV = "production"
$env:MONGO_URI = "mongodb+srv://sarafupay:YOURPASSWORD@cluster0.xxxxx.mongodb.net/sarafupay?retryWrites=true&w=majority"
$env:ADMIN_NAME = "SarafuPay Admin"
$env:ADMIN_EMAIL = "admin@your-domain.com"
$env:ADMIN_PHONE = "+255700000000"
$env:ADMIN_PASSWORD = "ChangeThisImmediately!"
npm --workspace server run seed
```

Run this only once. The seed script will skip if the admin user already exists.

---

## Pre-Launch Checklist

Work through this top to bottom before opening SarafuPay to real users.

### Infrastructure
- [ ] MongoDB Atlas cluster created, `/sarafupay` database in the connection string
- [ ] DigitalOcean App Platform backend deployed — `/health` returns 200
- [ ] Vercel frontend deployed — loads without console errors
- [ ] Custom domain on frontend with HTTPS
- [ ] Custom domain on backend with HTTPS

### Environment Variables
- [ ] `NODE_ENV=production` on the backend
- [ ] `CLIENT_URL` = frontend HTTPS URL, no trailing slash
- [ ] `SERVER_URL` = backend HTTPS URL, no trailing slash
- [ ] `MONGO_URI` includes the database name (`/sarafupay`)
- [ ] `JWT_SECRET` is 64+ random characters (not the same as dev)
- [ ] `NEXT_PUBLIC_API_PROXY_URL` set in Vercel to the backend HTTPS URL
- [ ] `SNIPPE_API_KEY` is the live key (not a test key)
- [ ] `SNIPPE_PROFILE_ID` is set so checkout shows "SarafuPay" branding
- [ ] `SNIPPE_WEBHOOK_SECRET` is set from the Snippe dashboard

### Snippe
- [ ] Webhook URL in Snippe dashboard updated to production backend URL
- [ ] Correct events subscribed: `payment.completed`, `payment.failed`, `payment.expired`, `payment.cancelled`
- [ ] Redirect / Return URL updated to production frontend URL

### Webhook Test (required before launch)
- [ ] Make a real M-Pesa payment on the production URL
- [ ] After completing M-Pesa on the Snippe page, **close the Snippe tab without waiting for redirect**
- [ ] Wait 15–30 seconds
- [ ] Check MongoDB: `db.payments.findOne({ status: "completed" })` — `paymentMethod` and `rawWebhookPayload` should be set (these are only written by the webhook path, not the return-page path)
- [ ] Confirm project `totalCollected` and `contributorCount` updated

### Security
- [ ] No API request in browser DevTools shows `SNIPPE_API_KEY` in any response
- [ ] Accessing another user's collection payments returns 404
- [ ] `/api/admin/*` returns 403 for a normal user account
- [ ] Admin password changed from seed default

---

## Troubleshooting

### CORS error in browser
**Symptom:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin'` on API requests.

**Causes and fixes:**
- `CLIENT_URL` on the backend does not exactly match the frontend origin. Check for trailing slashes, `http` vs `https`, or `www` vs non-www. It must match exactly what the browser shows in the address bar.
- Restarting the App Platform service after changing `CLIENT_URL` is required — changes to env vars require a redeploy.

---

### Login works but I get logged out immediately / session not saved
**Symptom:** Login succeeds (200 response) but the next page load shows the user as logged out, or API requests return 401.

**Causes and fixes:**
- `NODE_ENV` is not `production` on the backend. The cookie is set with `secure: false, sameSite: lax`, which browsers reject on cross-domain HTTPS. Set `NODE_ENV=production` and redeploy.
- The frontend URL and backend URL are on different TLDs (e.g. Vercel URL and App Platform URL without custom domains). The browser may block `sameSite: none` cookies from a `.ondigitalocean.app` backend when loaded from `.vercel.app`. Add custom domains on the same root domain (e.g. `your-domain.com` and `api.your-domain.com`) to resolve this reliably.

---

### Frontend API calls return 502
**Symptom:** API calls from the frontend return 502 Bad Gateway.

**Causes and fixes:**
- `NEXT_PUBLIC_API_PROXY_URL` is not set in Vercel. Next.js falls back to `http://127.0.0.1:5000`, which doesn't exist on Vercel's servers. Set this env var to your backend HTTPS URL and redeploy the frontend.
- The backend is not running. Check DigitalOcean App Platform logs for startup errors.

---

### Webhooks not arriving from Snippe
**Symptom:** Payments complete on Snippe but status stays `pending` in MongoDB (and no `paymentMethod` or `rawWebhookPayload` on the payment record).

**Causes and fixes:**
- Webhook URL in Snippe dashboard is still pointing to the old ngrok URL. Update it to `https://api.your-domain.com/api/webhooks/snippe`.
- `SNIPPE_WEBHOOK_SECRET` is not set on the backend. The server throws `500 WEBHOOK_SECRET_MISSING` before processing the event. Set the secret and redeploy.
- The backend `/api/webhooks/snippe` route is not reachable. Test it: `curl -X POST https://api.your-domain.com/api/webhooks/snippe` — you should get a 400 or 401 (not 502 or connection refused).

---

### Payment stuck on "pending" after user returns
**Symptom:** User redirected to `/payment/return` but the page shows "Pending" and never updates.

**Causes and fixes:**
- The redirect URL from Snippe does not include `?reference=SPY-...`. This was fixed in the codebase — if this happens in production it means you're running old code. Ensure the latest build is deployed.
- The Snippe API key is wrong or expired. The return-page verify path calls `GET /api/v1/sessions/:reference` directly. Check App Platform logs for Snippe API errors.

---

### MongoDB connection error on startup
**Symptom:** Backend logs show `MongoServerError: bad auth` or `MongoNetworkError: connect ETIMEDOUT`.

**Causes and fixes:**
- **Bad auth:** The password in `MONGO_URI` contains special characters (e.g. `@`, `#`, `%`) that need to be URL-encoded, or the password was not substituted for `<password>` in the connection string.
- **Connection timeout:** Atlas Network Access does not allow the DigitalOcean IP. Go to **Atlas → Network Access** and confirm `0.0.0.0/0` is listed, or add the specific DigitalOcean outbound IP.
- **Wrong database name:** The URI must include `/sarafupay` before the `?`. Check the full connection string.

---

> **Production launch is blocked until `SNIPPE_WEBHOOK_SECRET` is set and the webhook test passes.**
> See [FINAL_TEST_REPORT.md](./FINAL_TEST_REPORT.md) for the exact webhook test procedure.
