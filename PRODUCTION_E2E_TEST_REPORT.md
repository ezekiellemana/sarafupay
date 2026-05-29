# SarafuPay — Production E2E Test Report

> **Status:** PASSED  
> **Date:** 2026-05-29  
> **Version:** v1.15.6-project-structure-cleanup  
> **Tester:** Ezekiel Lemana

---

## 1. Production Architecture

| Layer | Platform | Domain |
|---|---|---|
| Frontend | Vercel | `https://sarafupay.app` |
| Backend | DigitalOcean App Platform | `https://api.sarafupay.app` |
| Database | MongoDB Atlas | Production cluster |
| Email | Resend | `notifications@notifications.sarafupay.app` |
| DNS | Namecheap | `sarafupay.app` |

---

## 2. Live Checks — All Passed

### Infrastructure

| Check | Result | Notes |
|---|---|---|
| Landing page loads (`https://sarafupay.app`) | ✅ PASS | Renders correctly, fonts load, no console errors |
| Backend health (`GET /health`) | ✅ PASS | `{ "status": "ok", "db": "connected", "environment": "production" }` |
| HTTPS active on both domains | ✅ PASS | TLS certificates valid, no mixed-content warnings |
| `robots.txt` served correctly | ✅ PASS | `/admin`, `/dashboard`, `/api` disallowed; Sitemap present |
| `sitemap.xml` returns 9 public URLs | ✅ PASS | All public routes indexed; admin/dashboard excluded |

### Authentication

| Check | Result | Notes |
|---|---|---|
| Register new account | ✅ PASS | Account created, session cookie set, redirected to dashboard |
| Login with email + password | ✅ PASS | Cookie secure + httpOnly in production; session persists on refresh |
| Login rejected with wrong password | ✅ PASS | 401 returned, no session cookie set |
| Non-admin user redirected from `/admin` | ✅ PASS | Redirected to `/dashboard` |
| Unauthenticated user redirected from `/dashboard` | ✅ PASS | Redirected to `/login` |

### Collections

| Check | Result | Notes |
|---|---|---|
| Create collection | ✅ PASS | Collection created, slug generated, dashboard shows new collection |
| Public payment page loads | ✅ PASS | `sarafupay.app/pay/<slug>` renders title, goal, contributor count |
| Public page works for logged-out visitor | ✅ PASS | No auth required to view or pay |

### Payments and Fees

| Check | Result | Notes |
|---|---|---|
| Snippe checkout opens | ✅ PASS | Redirected to Snippe-hosted checkout from public pay page |
| Fee breakdown displayed before payment | ✅ PASS | Contribution amount + 3% fee shown; min TZS 300, max TZS 5,000 enforced |
| Payment completes via M-Pesa | ✅ PASS | Snippe marks session as completed |
| Webhook fires and updates payment status | ✅ PASS | `POST /api/webhooks/snippe` returns 200; payment marked `completed` |
| Collection balance uses contribution amount only | ✅ PASS | `completedContributions` reflects full intended amount; service fee not deducted from balance |
| Admin revenue dashboard updates | ✅ PASS | This-month fee revenue shows collected service fee; total collection volume correct |

### Withdrawals

| Check | Result | Notes |
|---|---|---|
| Owner requests withdrawal | ✅ PASS | Withdrawal submitted; status `pending`; balance locked |
| Admin receives withdrawal notification email | ✅ PASS | Email arrives via Resend; contains owner name, collection, amounts; no phone/bank/providerFee exposed |
| Owner receives withdrawal submitted confirmation | ✅ PASS | Email arrives; contains amounts, status Pending, dashboard link |
| Admin approves withdrawal | ✅ PASS | Status → `approved`; owner receives approved email |
| Admin marks paid with reference | ✅ PASS | Status → `paid`; owner receives paid email with `payoutReference` |
| Withdrawal revenue metrics update | ✅ PASS | Admin withdrawals page shows paid volume, fees collected (TZS 2,000), net margin |

### Security

| Check | Result | Notes |
|---|---|---|
| `/api/*` returns 401 without session cookie | ✅ PASS | All protected routes enforce auth |
| `/admin/*` returns 403 for non-admin role | ✅ PASS | `requireAdmin` middleware enforced on every admin route |
| No stack traces in API error responses | ✅ PASS | Error responses return message + errorCode only |
| No `X-Powered-By: Express` header | ✅ PASS | Helmet removes it |
| CORS blocks requests from unknown origins | ✅ PASS | Only `https://sarafupay.app` allowed |
| `FEES_ENABLED=true` confirmed in production | ✅ PASS | Service fees charged on all completed payments |

---

## 3. Unchanged Systems — Confirmed Stable

| System | Status | Basis |
|---|---|---|
| Payment creation logic | ✅ Unchanged | No modifications since payment gateway integration |
| Webhook processing (`/api/webhooks/snippe`) | ✅ Unchanged | Signature verification and status update flow intact |
| Fee calculation (`calculateWithdrawalFee`, `feeVersion: 1`) | ✅ Unchanged | 3% contribution fee, TZS 2,000 withdrawal fee; no regressions |
| Withdrawal balance logic (`refreshCollectionStats`) | ✅ Unchanged | `completedContributions`, `lockedWithdrawals`, `availableForWithdrawal` all accurate |

---

## 4. Beta Monitoring Notes

These are ongoing watch items for the early-beta period — not bugs, not action items, just operational awareness:

### Snippe Webhooks
- Monitor the Snippe dashboard for webhook delivery success rates
- A `payment.completed` event that fails to deliver will leave a payment in `pending` status — Snippe retries automatically, but watch for persistent failures
- If a webhook fails repeatedly, check DigitalOcean App Platform logs for the `/api/webhooks/snippe` endpoint and verify the `SNIPPE_WEBHOOK_SECRET` is correct

### Resend Email Logs
- Monitor the Resend dashboard for delivery rates and bounces
- If the `notifications@notifications.sarafupay.app` sending domain shows dips in deliverability, check DKIM/SPF records in Namecheap are still intact
- Watch for `[email] ... failed for withdrawal ...` lines in DigitalOcean logs — these indicate Resend errors (not withdrawal errors)

### MongoDB Atlas
- Monitor Atlas → Metrics for connection count, operation latency, and storage growth
- Set up Atlas alerts for: connections > 80% of cluster limit, storage > 70%, replication lag
- Current IP allowlist: confirm it is set to your DigitalOcean App Platform outbound IPs only, or restrict from `0.0.0.0/0` as soon as the platform's static IPs are confirmed stable

### MongoDB IP Allowlist (action when stable)
- If the Atlas Network Access is currently open (`0.0.0.0/0`), narrow it to the DigitalOcean App Platform outbound IP range once beta traffic patterns are known
- DigitalOcean App Platform → your app → Settings → trusted sources shows the outbound IPs

### Beta User Onboarding
- Invite controlled beta users first before public announcement
- Confirm the full payment → webhook → balance → withdrawal flow works for a real user (not just the owner test account) before opening broadly
- Monitor the admin dashboard for the first real withdrawals — manually review each one carefully during beta

---

## 5. Version History (this release)

| Tag | Description |
|---|---|
| `v1.15.1-withdrawal-revenue-metrics` | W6 — Admin withdrawal revenue metrics |
| `v1.15.2-launch-trust-pages` | L1 — Public trust + legal pages |
| `v1.15.3-production-seo-hardening` | SEO hardening, robots, sitemap, error pages |
| `v1.15.4-email-notifications` | N1 — Withdrawal email notifications via Resend |
| `v1.15.5-production-env-readiness` | Production env checklist + SNIPPE_BASE_URL safety |
| `v1.15.6-project-structure-cleanup` | Remove Railway config, dead GlassCard, fix docs |
