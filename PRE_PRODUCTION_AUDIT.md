# SarafuPay — Pre-Production Audit

**Date:** May 2026  
**Branch:** `pre-production-hardening`  
**Auditor:** Claude Code  
**Scope:** Security, payment reliability, data integrity, UX completeness, admin readiness, production essentials, testing gaps

---

## Completion Status

All 12 targeted hardening items are complete. The branch is ready to merge as `v1.2.0-pre-production-hardening`.

| # | Item | Status |
| --- | --- | --- |
| 1 | Env schema hardening (Snippe vars fail-fast in production) | ✅ Done |
| 2 | Verify endpoint PII restriction | ✅ Done |
| 3 | `dangerouslySetInnerHTML` removal from terms page | ✅ Done |
| 4 | Proxy route protection (`/dashboard`, `/admin`) | ✅ Done |
| 5 | Global + webhook rate limiters | ✅ Done |
| 6 | Admin payments pagination (50/page) | ✅ Done |
| 7 | Admin CSV export cross-origin fix | ✅ Done |
| 8 | CSP and security headers in `next.config.ts` | ✅ Done |
| 9 | Support email replacement (`sarafupaytz@gmail.com`) | ✅ Done |
| 10 | Admin dashboard aggregation (MongoDB pipelines, no full collection load) | ✅ Done |
| 11 | Admin client-side role guard (`AdminGuard` + `app/admin/layout.tsx`) | ✅ Done |
| 12 | MongoDB health check in `GET /health` (200/503) | ✅ Done |

---

## Legend

| Label | Meaning |
| --- | --- |
| 🔴 CRITICAL | Must fix before any production traffic |
| 🟡 IMPORTANT | Fix before public launch or within first sprint |
| 🟢 NICE TO HAVE | Can ship without; improvements for later |
| ✅ DONE | Fixed in `pre-production-hardening` branch |

---

## 1. Security

### ✅ DONE — 🔴 CRITICAL — Payment verify endpoint is unauthenticated

**File:** `server/src/routes/payment.routes.ts` line 8  
**Finding:** `GET /api/payments/verify/:reference` had no `protect` middleware. Anyone who knew or guessed a reference value could retrieve the full payment document including PII.

**Fix:** `verifyPayment` controller now returns a safe `publicPayment` object — strips `customerPhone`, `customerEmail`, `payerMessage`, `rawWebhookPayload`, `metadata`, and internal IDs for all callers. The `/payment/return` page only needs `status`, `reference`, `amount`, `currency`, and populated `projectId.thankYouMessage`, which are all retained.

---

### ✅ DONE — 🔴 CRITICAL — Snippe env vars are optional in Zod schema

**File:** `server/src/config/env.ts` lines 15–16  
**Finding:** `SNIPPE_API_KEY` and `SNIPPE_WEBHOOK_SECRET` were `.optional()`, allowing the server to start without them in production.

**Fix:** Added a post-parse production guard that throws on startup if either variable is missing, with a clear error message listing which vars are absent.

---

### ✅ DONE — 🔴 CRITICAL — `dangerouslySetInnerHTML` in terms page

**File:** `client/app/terms/page.tsx` line 84  
**Finding:** `<span dangerouslySetInnerHTML={{ __html: item }} />` used in a `.map()` over static strings — an XSS sink if the source ever became dynamic.

**Fix:** Replaced with plain `<span>{item}</span>`. Apostrophes and quotes rendered via real Unicode characters. TODO comment removed. Email updated to `sarafupaytz@gmail.com`.

---

### ✅ DONE — 🟡 IMPORTANT — No global rate limiter on all routes

**File:** `server/src/middleware/rateLimit.middleware.ts`  
**Finding:** Rate limiting was applied only to specific routes. The verify endpoint and admin reads had no fallback protection.

**Fix:** Added `globalApiLimiter` (300 req / 15 min per IP) applied to all `/api/*` routes in `app.ts`, skipping `/webhooks`. Added `webhookLimiter` (60 req / 5 min) on the Snippe webhook route.

---

### ✅ DONE — 🟡 IMPORTANT — No Next.js middleware for route protection

**File:** `client/proxy.ts`  
**Finding:** `/dashboard/*` and `/admin/*` relied entirely on API 401/403 responses. Users saw the full UI shell before auth errors arrived.

**Fix:** `proxy.ts` checks the auth cookie for all protected routes. For `/admin/*` routes, it additionally calls `GET /api/auth/me` to verify `role === "admin"`, redirecting members to `/dashboard` and unauthenticated users to `/login?next=<path>`.

---

### ✅ DONE — 🟡 IMPORTANT — Admin pages have no client-side role guard

**Files:** `client/components/auth/AdminGuard.tsx`, `client/app/admin/layout.tsx`, `client/components/layout/DashboardShell.tsx`  
**Finding:** Member users navigating to `/admin` saw the full admin shell render before API returned 403.

**Fix:** `AdminGuard` component blocks render until auth is hydrated, then redirects members to `/dashboard` and null users (auth failure) to `/login`. An `app/admin/layout.tsx` applies this guard to all `/admin/*` routes automatically. `DashboardShell` null-user redirect also fixed.

---

### 🟢 NICE TO HAVE — No email verification on signup

**Finding:** Users can register with any email address. No verification step exists.

---

### 🟢 NICE TO HAVE — No password reset flow

**Finding:** If a user forgets their password, there is no recovery path.

---

## 2. Payment Reliability

### 🟡 IMPORTANT — `notifyPaymentStatusChanged` is a no-op stub

**File:** `server/src/services/notification.service.ts`  
**Finding:** Called by `handleSnippeWebhook` after every completed payment. Currently returns `Promise.resolve()`. No logging, no error boundary.

**Risk:** Low at MVP. Becomes a gap when owner notifications are required.

---

### ✅ DONE — 🟡 IMPORTANT — `getAdminDashboard` loads all payments into memory

**File:** `server/src/services/dashboard.service.ts` line 42  
**Finding:** `Payment.find()` with no filter or limit fetched every payment document into Node.js heap. OOM risk at scale.

**Fix:** Replaced with 7 parallel MongoDB operations: `aggregate` for total collected, `aggregate` for status counts, `distinct` for paid-this-month user IDs, `countDocuments` for member total, `aggregate` with `$sort → $limit(12) → $sort` pipeline for monthly chart, `find().limit(8).lean()` for latest payments. `buildMonthlyChart` helper removed. Response shape unchanged.

---

### 🟡 IMPORTANT — `exportPaymentsCsv` (admin) has no row limit

**File:** `server/src/controllers/collection.controller.ts`  
**Finding:** `Payment.find({ projectId: collection._id })` — no `.limit()`. Large collections can exhaust memory.

**Fix approach:** Stream the cursor or add `?limit` pagination. Not addressed in this branch — schedule for first post-launch sprint.

---

### 🟢 NICE TO HAVE — `generateExternalReference` entropy is 32 bits

**Finding:** 4 bytes of entropy per reference. The unique Mongoose index catches duplicates correctly. Low risk; mention in runbooks.

---

## 3. Data Integrity

### 🟡 IMPORTANT — `getMemberDashboard` assumes one active project

**File:** `server/src/services/dashboard.service.ts` line 9  
**Finding:** `Project.findOne({ status: "active" }).sort({ createdAt: 1 })` silently returns only the oldest active project if multiple exist.

**Fix approach:** Enforce single-active-project at creation time, or update dashboard to list all. Document current behavior.

---

### ✅ DONE — 🟡 IMPORTANT — Admin controller uses `any` type for query building

**File:** `server/src/controllers/admin.controller.ts`  
**Finding:** `const query: any` in the `members` handler bypassed TypeScript safety on query field names.

**Fix:** Changed to `const query: Record<string, unknown>` with conditional `$or` assignment, matching the pattern already used in the `payments` handler.

---

### 🟢 NICE TO HAVE — Missed months calculation depends on `project.startDate`

**File:** `server/src/services/dashboard.service.ts` line 19  
**Finding:** `monthRange(project.startDate, new Date())` — behavior with `undefined` `startDate` should be verified.

---

## 4. UX Completeness

### 🟡 IMPORTANT — Navy brand remnants in admin and terms pages

**Files:**

- `client/app/admin/page.tsx` — `text-[#0B1F3A]` and blue gradient in stat cards
- `client/app/terms/page.tsx` — `text-[#0b1f3a]` in `h1` and `Section` h2

**Finding:** Gold & green brand refresh missed these two pages. Scheduled for brand-polish sprint.

---

### ✅ DONE — 🟡 IMPORTANT — `sarafupaytz@gmail.com` email in Terms page is unconfirmed

**File:** `client/app/terms/page.tsx`  
**Finding:** A TODO comment flagged the email as unconfirmed.

**Fix:** TODO comment removed. Email `sarafupaytz@gmail.com` confirmed and applied across Terms, Privacy, `DEPLOYMENT.md`, and `PRE_PRODUCTION_AUDIT.md`.

---

### 🟢 NICE TO HAVE — Terms and Privacy pages are deindexed

**File:** `client/app/terms/page.tsx` line 7  
**Finding:** `robots: { index: false, follow: false }`. Reconsider before public launch.

---

### 🟢 NICE TO HAVE — Public payment return page shows account prompt for all payment states

**File:** `client/app/payment/return/page.tsx`  
**Finding:** "Login or create an account" prompt renders even for failed/pending payments — should only appear for completed payments.

---

## 5. Admin Readiness

### ✅ DONE — 🟡 IMPORTANT — Admin CSV export link uses `apiUrl` directly (no auth header)

**File:** `client/app/admin/payments/page.tsx`  
**Finding:** Plain `<a href>` to the Express server — auth cookie not sent cross-origin.

**Fix:** Replaced with `handleExport` using `fetch(..., { credentials: "include" })`, creating a blob URL and triggering a programmatic download. Works correctly in both same-origin and cross-origin configurations.

---

### ✅ DONE — 🟡 IMPORTANT — No pagination on admin payments list

**Files:** `client/app/admin/payments/page.tsx`, `server/src/controllers/admin.controller.ts`  
**Finding:** API fetched all records; UI rendered all records.

**Fix:** Payments API supports `?page&limit` (max 100, default 50) returning `{ payments, total, page, limit, totalPages }`. UI has prev/next pagination controls and resets to page 1 on search change. Members list pagination deferred (lower volume).

---

### 🟢 NICE TO HAVE — No admin action log / audit trail

**Finding:** Admin actions are not logged. Schedule for a later sprint.

---

## 6. Production Essentials

### 🟡 IMPORTANT — `CLIENT_URL` stored in payment links at creation time

**File:** `server/src/services/collection.service.ts` line 36  
**Finding:** `publicPaymentLink` stored in DB at creation time. Domain migration would stale all links. The slug is the durable key; the link can be regenerated. Document as migration concern.

---

### ✅ DONE — 🟡 IMPORTANT — No Content-Security-Policy header configured

**File:** `client/next.config.ts`  
**Finding:** No CSP headers. Helmet applied on API server only.

**Fix:** Full CSP configured in `next.config.ts`: `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev for Turbopack), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: https:`, `font-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`. Plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

---

### ✅ DONE — 🟡 IMPORTANT — MongoDB lacks health check

**Finding:** `GET /health` returned `200` unconditionally with no DB status. Load balancers could not distinguish a healthy server from one with a lost DB connection.

**Fix:** Health endpoint now checks `mongoose.connection.readyState === 1`. Returns `200` with `{ status: "ok", db: "connected", uptime, environment, timestamp }` when connected. Returns `503` with `{ status: "degraded", db: "disconnected", ... }` when not. No URI, host, username, or credentials exposed.

---

### 🟢 NICE TO HAVE — `GET /health` previously returned 200 unconditionally

Resolved by the fix above.

---

## 7. Testing Gaps

### 🟡 IMPORTANT — No automated tests exist

**Finding:** No test files found. Highest-priority coverage to add:

1. `webhookVerifier.ts` — HMAC validation, replay attack rejection
2. `payment.service.ts` — `createPublicPayment` duplicate prevention, paused collection blocking
3. `payment.service.ts` — `handleSnippeWebhook` idempotency
4. `collection.service.ts` — `getPublicCollectionBySlug` does not leak `ownerId`
5. `generateExternalReference` — unique, correctly-formatted references

---

### 🟡 IMPORTANT — No integration test for webhook end-to-end path

**Finding:** Full webhook path tested manually only. No automated regression test.

---

## Remaining Open Items (Post-Launch)

| Priority | Item | File |
| --- | --- | --- |
| 🟡 | Cursor streaming or pagination on admin CSV export | `server/src/controllers/collection.controller.ts` |
| 🟡 | Enforce single-active-project at creation or document assumption | `server/src/services/dashboard.service.ts` |
| 🟡 | Implement `notifyPaymentStatusChanged` (at minimum: console log) | `server/src/services/notification.service.ts` |
| 🟡 | Write webhook verifier unit tests | New test files |
| 🟡 | Write integration test for webhook end-to-end path | New test files |
| 🟡 | Navy brand remnants in admin overview and terms pages | `client/app/admin/page.tsx`, `client/app/terms/page.tsx` |
| 🟡 | Pagination on admin members list | `server/src/controllers/admin.controller.ts` |
| 🟢 | Email verification on signup | New feature |
| 🟢 | Password reset flow | New feature |
| 🟢 | Re-evaluate robots noindex on Terms and Privacy pages | `client/app/terms/page.tsx`, `client/app/privacy/page.tsx` |
| 🟢 | Account prompt on payment return only for completed payments | `client/app/payment/return/page.tsx` |
| 🟢 | Admin action audit log | New feature |
| 🟢 | Document `CLIENT_URL`/slug migration concern in DEPLOYMENT.md | `DEPLOYMENT.md` |
