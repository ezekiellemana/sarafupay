# SarafuPay — Production Environment Checklist

> **Status:** Pre-launch checklist for v1.15.x  
> **Last updated:** 2026-05-29  
> **Arch:** Next.js (Vercel) frontend + Express (DigitalOcean App Platform) backend + MongoDB Atlas

---

## 1. Backend Environment Variables

Set these in DigitalOcean App Platform → your app → Settings → Environment Variables.  
**Never commit `.env` or `.env.production` to git.**

| Variable | Required | Production value | Notes |
|---|---|---|---|
| `NODE_ENV` | **Required** | `production` | Enables secure cookies, production CORS, fail-fast checks |
| `PORT` | Optional | `5000` | Host platform usually sets this automatically |
| `CLIENT_URL` | **Required** | `https://sarafupay.app` | Used for CORS. Must match exactly — no trailing slash |
| `SERVER_URL` | **Required** | `https://api.sarafupay.app` | Used for self-reference. No trailing slash |
| `MONGO_URI` | **Required** | `mongodb+srv://...` | MongoDB Atlas connection string with DB name |
| `JWT_SECRET` | **Required** | 64+ random chars | Min 24 enforced by schema. Use 64+ in production |
| `JWT_EXPIRES_IN` | Optional | `7d` | Default is 7 days |
| `COOKIE_NAME` | Optional | `sarafupay_token` | Must match `proxy.ts` hardcoded value |
| `SNIPPE_API_KEY` | **Required** | `sk_live_...` | Server will not start without this in production |
| `SNIPPE_WEBHOOK_SECRET` | **Required** | `whsec_...` | Server will not start without this in production |
| `SNIPPE_BASE_URL` | **Required** | `https://api.snippe.sh` | Server will not start without this in production. No default in production — must be set explicitly |
| `SNIPPE_PROFILE_ID` | **Required** | `prof_...` | Your Snippe merchant profile ID |
| `FEES_ENABLED` | **Required** | `true` | ⚠️ Must be `true` in production. If absent or `false`, no service fees are charged to contributors |
| `GOOGLE_CLIENT_ID` | Optional | `xxx.apps.googleusercontent.com` | Google OAuth. Google login disabled if absent |
| `GOOGLE_CLIENT_SECRET` | Optional | `GOCSPX-...` | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | Optional | `https://sarafupay.app/api/auth/google/callback` | Must be registered in Google Cloud Console. Goes through the Next.js proxy — use the frontend URL, not the backend URL |
| `RESEND_API_KEY` | Optional | `re_live_...` | Email notifications. Server starts without it; notifications silently disabled |
| `EMAIL_FROM` | Optional | `SarafuPay <notifications@notifications.sarafupay.app>` | Must match your verified Resend sending domain |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | `support.sarafupay@gmail.com` | Who receives new withdrawal request alerts |
| `ADMIN_NAME` | Do not set | — | Seed script only. Remove from production runtime env after admin is created |
| `ADMIN_EMAIL` | Do not set | — | Seed script only. Remove from production runtime env after admin is created |
| `ADMIN_PHONE` | Do not set | — | Seed script only. Remove from production runtime env |
| `ADMIN_PASSWORD` | Do not set | — | Seed script only. Remove from production runtime env |

### Backend `.env` template for production

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://sarafupay.app
SERVER_URL=https://api.sarafupay.app
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/sarafupay?retryWrites=true&w=majority
JWT_SECRET=<64-char-random-hex>
JWT_EXPIRES_IN=7d
COOKIE_NAME=sarafupay_token

SNIPPE_API_KEY=sk_live_...
SNIPPE_WEBHOOK_SECRET=whsec_...
SNIPPE_BASE_URL=https://api.snippe.sh
SNIPPE_PROFILE_ID=prof_...
FEES_ENABLED=true

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://sarafupay.app/api/auth/google/callback

RESEND_API_KEY=re_live_...
EMAIL_FROM=SarafuPay <notifications@notifications.sarafupay.app>
ADMIN_NOTIFICATION_EMAIL=support.sarafupay@gmail.com
```

---

## 2. Frontend Environment Variables

Set these in Vercel dashboard under Project → Settings → Environment Variables.  
`NEXT_PUBLIC_*` variables are bundled into the client build — **never put secrets here**.

| Variable | Required | Production value | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Required** | *(empty string)* | Leave blank in production. Calls go to same origin and are proxied by Next.js rewrites to the backend |
| `NEXT_PUBLIC_API_PROXY_URL` | **Required** | `https://api.sarafupay.app` | Used by Next.js rewrites and the middleware proxy. Must be the backend URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | `phc_...` | PostHog analytics key. Leave blank if not using analytics yet |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | `https://us.i.posthog.com` | PostHog host. Only needed if `NEXT_PUBLIC_POSTHOG_ENABLED=true` |
| `NEXT_PUBLIC_POSTHOG_ENABLED` | Optional | `false` | Set `true` only when your privacy policy covers analytics collection |

### Frontend `.env.production` template

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_API_PROXY_URL=https://api.sarafupay.app
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_ENABLED=false
```

---

## 3. Security Rules

| Rule | Status | Action required |
|---|---|---|
| `JWT_SECRET` is 64+ random chars | Verify | Run `openssl rand -hex 64` or `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| No localhost/ngrok URLs in production env | Verify | Search env vars for `localhost`, `127.0.0.1`, `ngrok` |
| Cookies are `secure: true` in production | ✓ Automatic | `cookieHelpers.ts` sets `secure: isProduction`. Requires `NODE_ENV=production` |
| Cookies use `sameSite: "none"` in production | ✓ Automatic | Required because frontend (sarafupay.app) and backend (api.sarafupay.app) are different origins. Already configured |
| `trust proxy: 1` is set | ✓ Done | `app.ts` sets this. Required for DigitalOcean App Platform to forward real IPs correctly |
| CORS only allows production frontend | ✓ Automatic | `app.ts` builds `allowedOrigins` from `CLIENT_URL`. In production, no localhost in list |
| No secrets in `NEXT_PUBLIC_*` vars | Verify | All public vars are analytics keys or empty API URL. No JWT/Snippe/Resend secrets |
| `FEES_ENABLED=true` is set deliberately | Verify | Without it, service fees are not charged. Must be conscious decision |
| `SNIPPE_WEBHOOK_SECRET` is set before live traffic | ✓ Required | Server refuses to start in production without it |
| Resend API key is not committed to git | ✓ Confirmed | `.gitignore` excludes `server/.env`. `.env.example` has no real key |
| MongoDB Atlas has IP access restrictions | Verify | Either allowlist your hosting platform's IP ranges, or enable Atlas private networking. Public `0.0.0.0/0` is unsafe |
| MongoDB Atlas user has least-privilege access | Verify | DB user should have `readWrite` on the `sarafupay` database only |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` removed from production runtime env | Verify | Seed script vars. Dangerous to leave in runtime env |
| CSP headers are set | ✓ Done | `next.config.ts` sets full CSP, X-Frame-Options, X-Content-Type-Options |
| HTTPS enforced on both domains | Verify | Both `sarafupay.app` and `api.sarafupay.app` must serve HTTPS |

---

## 4. Production Deployment Checklist

### DNS
- [ ] `sarafupay.app` → Vercel (CNAME or A record)
- [ ] `api.sarafupay.app` → DigitalOcean App Platform (CNAME provided in App → Settings → Domains)
- [ ] Both domains have valid TLS certificates (Let's Encrypt or platform-provided)

### Google OAuth
- [ ] In Google Cloud Console → OAuth 2.0 credentials, add authorized redirect URI: `https://sarafupay.app/api/auth/google/callback`
- [ ] Remove any `localhost` redirect URIs from the production OAuth client
- [ ] Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in backend env

### Snippe

- [ ] Set `SNIPPE_BASE_URL=https://api.snippe.sh` in backend env (server will not start without it in production)
- [ ] Configure Snippe webhook URL: `https://api.sarafupay.app/api/webhooks/snippe`
- [ ] Configure Snippe payment return/redirect URL: `https://sarafupay.app/payment/complete` (or equivalent)
- [ ] Confirm `SNIPPE_PROFILE_ID` matches your live merchant account
- [ ] Use live `SNIPPE_API_KEY` (not test/sandbox key)

### Resend
- [ ] Verify sending domain `notifications.sarafupay.app` in Resend dashboard (DNS TXT + DKIM records)
- [ ] Set `RESEND_API_KEY` to live key in backend env
- [ ] Set `EMAIL_FROM` to `SarafuPay <notifications@notifications.sarafupay.app>`
- [ ] Set `ADMIN_NOTIFICATION_EMAIL` to the team inbox (`support.sarafupay@gmail.com`)
- [ ] Send a test withdrawal request and confirm email received

### MongoDB Atlas
- [ ] Use a production Atlas cluster (M10 or higher recommended, not M0 free tier for launch)
- [ ] Set IP allowlist to your hosting platform's outbound IPs (or use VPC peering)
- [ ] Create a dedicated DB user with `readWrite` on `sarafupay` database only
- [ ] Enable Atlas backups

### Frontend (Vercel)
- [ ] Set all `NEXT_PUBLIC_*` env vars in Vercel dashboard for `Production` environment
- [ ] Confirm `NEXT_PUBLIC_API_PROXY_URL=https://api.sarafupay.app`
- [ ] Confirm `NEXT_PUBLIC_API_URL=` (empty)
- [ ] Run production build: `cd client && npm run build`
- [ ] Verify no build errors
- [ ] Confirm `sarafupay.app/robots.txt` returns correctly
- [ ] Confirm `sarafupay.app/sitemap.xml` returns 9 URLs

### Backend (DigitalOcean App Platform)

- [ ] Set all backend env vars listed in Section 1
- [ ] Confirm `NODE_ENV=production`
- [ ] Confirm `FEES_ENABLED=true`
- [ ] Deploy backend and confirm health endpoint: `GET https://api.sarafupay.app/health` returns `{ "status": "ok" }`
- [ ] Confirm `db: "connected"` in health response

---

## 5. Real-Money Test Plan

Run this end-to-end test in production before announcing launch.

1. **Create collection** — Register an account, create a collection, confirm collection page loads at `sarafupay.app/pay/<slug>`
2. **Open public pay link** — Open in a separate browser (logged out). Confirm page loads with correct title, goal, contributor count
3. **Make a test payment** — Pay the minimum test amount using M-Pesa sandbox or a real test amount
4. **Confirm fee charged** — Confirm the contributor was charged `amount + 3% fee` (minimum TZS 300, maximum TZS 5,000). Confirm collection received the full `amount` (not amount minus fee)
5. **Confirm webhook fired** — Check backend logs or Snippe dashboard for `payment.completed` webhook. Confirm no 400/500 errors on the webhook endpoint
6. **Confirm collection total** — Confirm `completedContributions` in the dashboard reflects the contribution amount, not the fee-inclusive total
7. **Confirm admin revenue updated** — Open `/admin` dashboard. Confirm this month's fee revenue shows the collected fee
8. **Request withdrawal** — From the collection owner dashboard, request a withdrawal of TZS 10,000 (minimum). Confirm:
   - Admin receives notification email
   - Owner receives "Withdrawal request received" confirmation email
9. **Admin approve + mark paid** — In `/admin/withdrawals`, approve then mark-paid with a reference number. Confirm:
   - Owner receives "approved" email
   - Owner receives "paid" email with the reference number
10. **Confirm withdrawal revenue metrics** — In `/admin` and `/admin/withdrawals`, confirm paid withdrawal volume and fee (TZS 2,000) appear in the metrics row

---

## 6. Rollback Plan

| Scenario | Action |
|---|---|
| Fees are broken or overcharging | Set `FEES_ENABLED=false` in backend env and redeploy. Fees immediately stop being applied to new payments |
| Critical bug in a deployed feature | Revert to the last stable git tag using Vercel/DigitalOcean instant rollback, or `git revert` + redeploy |
| Email notifications causing issues | Remove `RESEND_API_KEY` from backend env. All email sends silently skip. No restart needed on most platforms |
| Snippe webhook errors | Fix the handler. Snippe retries webhooks — existing events will re-deliver once the endpoint is healthy |
| Need to pause new collections | No built-in kill switch. Options: (a) set `CLIENT_URL` to a maintenance page URL to break CORS, or (b) deploy a maintenance page at the Vercel level |
| Need to protect existing sessions | Existing JWT sessions remain valid through any env change except rotating `JWT_SECRET`. Do NOT rotate `JWT_SECRET` during an incident — it logs out all users |
| Fee model rollback (`feeVersion`) | The fee engine uses `feeVersion: 1` records. Setting `FEES_ENABLED=false` is the safe rollback — it skips fees entirely without touching existing payment records |
| MongoDB data corruption | Restore from Atlas point-in-time backup. Atlas M10+ supports PITR |

---

## 7. Final Go-Live Checklist

Run through every item before announcing launch.

### Environment
- [ ] `NODE_ENV=production` confirmed on backend
- [ ] `FEES_ENABLED=true` confirmed
- [ ] `SNIPPE_API_KEY` is the **live** (not test) key
- [ ] `SNIPPE_WEBHOOK_SECRET` is set and matches Snippe dashboard
- [ ] `SNIPPE_BASE_URL` confirmed correct with Snippe
- [ ] `CLIENT_URL=https://sarafupay.app` (no trailing slash, no localhost)
- [ ] `MONGO_URI` points to production Atlas cluster
- [ ] `JWT_SECRET` is 64+ chars, random, not the example value
- [ ] `RESEND_API_KEY` is set, domain verified
- [ ] Admin seed vars (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`) removed from production runtime env
- [ ] No `localhost` or `ngrok` URLs anywhere in production env

### Infrastructure
- [ ] `GET https://api.sarafupay.app/health` → `{ "status": "ok", "db": "connected" }`
- [ ] `https://sarafupay.app` loads correctly
- [ ] `https://sarafupay.app/robots.txt` returns robots.txt with Sitemap line
- [ ] `https://sarafupay.app/sitemap.xml` returns 9 public URLs
- [ ] HTTPS certificate valid on both domains
- [ ] MongoDB Atlas IP allowlist set

### Features
- [ ] Registration works
- [ ] Login works (email + password)
- [ ] Google OAuth works (if enabled)
- [ ] Collection creation works
- [ ] Public pay page loads
- [ ] Payment flow works end-to-end (webhook fires, balance updates)
- [ ] Withdrawal request works, admin email received
- [ ] Admin withdraw actions work, owner emails received
- [ ] Admin dashboard loads revenue metrics correctly
- [ ] `/pricing`, `/faq`, `/about`, `/contact`, `/refund-policy`, `/withdrawal-policy` all load
- [ ] `/admin` is blocked from search engines (confirmed by `robots.txt` `Disallow: /admin`)
- [ ] `/dashboard` is blocked from search engines

### Security
- [ ] `/api/*` routes return 401 without a valid session cookie
- [ ] `/admin/*` routes return 403 for non-admin users
- [ ] No stack traces in production API error responses
- [ ] No `X-Powered-By: Express` header (helmet removes it)
