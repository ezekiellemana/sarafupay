# SarafuPay — Pre-Production Audit

**Date:** May 2026  
**Branch:** `pre-production-hardening`  
**Auditor:** Claude Code  
**Scope:** Security, payment reliability, data integrity, UX completeness, admin readiness, production essentials, testing gaps

---

## Legend

| Label | Meaning |
|---|---|
| 🔴 CRITICAL | Must fix before any production traffic |
| 🟡 IMPORTANT | Fix before public launch or within first sprint |
| 🟢 NICE TO HAVE | Can ship without; improvements for later |

---

## 1. Security

### 🔴 CRITICAL — Payment verify endpoint is unauthenticated

**File:** `server/src/routes/payment.routes.ts` line 8  
**Finding:** `GET /api/payments/verify/:reference` has no `protect` middleware. Anyone who knows or guesses a `snippeReference`, `externalReference`, or `sessionId` value can retrieve the full payment document, including `customerName`, `customerPhone`, `customerEmail`, `payerMessage`, and payment status.

**Risk:** PII exposure. References follow a predictable prefix pattern (`SPY-YYYY-MM-XXXXXX-HHHHHHHH`), and the verify endpoint is also called by the public `/payment/return` page — meaning the endpoint is intentionally open to unauthenticated browsers. The fix is to return only a safe public subset for unauthenticated callers (status, reference, amount, currency, collection title) and require auth to see PII fields.

**Fix approach:** Add a `publicVerifyPayment` controller that returns only `{ status, reference, amount, currency, collectionTitle, paidAt }`. The full response with PII fields (`customerPhone`, `customerEmail`, `payerMessage`) should only be returned when `req.user` exists and owns the payment.

---

### 🔴 CRITICAL — Snippe env vars are optional in Zod schema

**File:** `server/src/config/env.ts` lines 15–16  
**Finding:**
```typescript
SNIPPE_API_KEY: z.string().optional(),
SNIPPE_WEBHOOK_SECRET: z.string().optional(),
```
The server starts successfully even if these are missing from the environment. In production, a misconfigured deploy would serve the app, accept payment requests, and fail silently inside `createPaymentSession` rather than crashing at startup with a clear error.

**Fix approach:** Change both to `z.string().min(1)` with no `.optional()`. Add `.refine()` if you want conditional logic for test environments.

---

### 🔴 CRITICAL — `dangerouslySetInnerHTML` in terms page

**File:** `client/app/terms/page.tsx` line 84  
**Finding:**
```tsx
<span dangerouslySetInnerHTML={{ __html: item }} />
```
Used inside a `.map()` over a static string array. Currently safe because the array is hardcoded, but the pattern is dangerous — if `item` ever comes from an API response or a CMS, this becomes an XSS sink.

**Fix approach:** Render `{item}` as a plain text node. The prohibited activities list is static and needs no HTML interpretation. The existing apostrophe and quote strings should use JSX escape sequences (`&apos;`, `&quot;`) or standard Unicode characters instead.

---

### 🟡 IMPORTANT — No global rate limiter on all routes

**File:** `server/src/middleware/rateLimit.middleware.ts`  
**Finding:** Rate limiting is applied only to specific routes:
- `authLimiter` — login/register (20 req / 15 min)
- `paymentLimiter` — authenticated payment creation (30 req / 10 min)
- `publicPaymentLimiter` — public payment creation (15 req / 10 min)
- `publicCollectionLimiter` — public collection fetch (120 req / 15 min)

Routes without rate limiting include: `GET /api/payments/verify/:reference`, all authenticated dashboard reads, admin reads, and webhook.

**Risk:** Low for most (auth-protected), but the verify endpoint is public and could be used to enumerate payment references.

**Fix approach:** Add a broad fallback global limiter (e.g., 300 req / 15 min per IP) applied before all routes in `app.ts`, in addition to the existing fine-grained limiters.

---

### 🟡 IMPORTANT — No Next.js middleware for route protection

**File:** `client/` — no `middleware.ts` exists  
**Finding:** Dashboard routes (`/dashboard/*`, `/admin/*`) rely entirely on API returning 401/403. A user who navigates directly to `/admin` will see the full admin UI shell render, then get empty/error states from the API. This means:
1. Admin route structure is visible to unauthenticated users
2. No server-side redirect before the page renders
3. Flash of unauthenticated UI on every protected page load

**Fix approach:** Create `client/middleware.ts` using Next.js `NextResponse.redirect`. Read the auth cookie; if missing or invalid, redirect to `/login?next=<path>`. Admin routes additionally redirect non-admins to `/dashboard`.

---

### 🟢 NICE TO HAVE — No email verification on signup

**Finding:** Users can register with any email address. No verification step exists. The email is used for sending receipts (if notification service is expanded) and as a unique identifier.

---

### 🟢 NICE TO HAVE — No password reset flow

**Finding:** If a user forgets their password, there is no recovery path. This is a support burden in production.

---

## 2. Payment Reliability

### 🟡 IMPORTANT — `notifyPaymentStatusChanged` is a no-op stub

**File:** `server/src/services/notification.service.ts`  
**Finding:**
```typescript
export const notifyPaymentStatusChanged = async () => {
  return Promise.resolve();
};
```
Called by `handleSnippeWebhook` after every completed payment. Currently does nothing. If real notification logic is ever added here (email, SMS, push), the callers already expect it to be async and fire-and-forget — which is correct. But there is no logging, no error boundary, and no indication to the developer that this stub needs implementation.

**Risk:** Low at MVP. Becomes a gap the moment any real-time owner notification is expected.

---

### 🟡 IMPORTANT — `getAdminDashboard` loads all payments into memory

**File:** `server/src/services/dashboard.service.ts` line 42  
**Finding:**
```typescript
Payment.find().populate("userId", ...).populate("projectId", ...).sort({ createdAt: -1 })
```
Fetches **every payment document** in the database into a Node.js array. At small scale this is fine. At 10,000+ payments this will cause memory spikes and slow admin dashboard loads.

**Fix approach:** Replace in-memory aggregation with MongoDB aggregation pipeline queries. The `buildMonthlyChart`, `paidMembersThisMonth`, and totals can all be computed server-side.

---

### 🟡 IMPORTANT — `exportPaymentsCsv` (admin) has no row limit

**File:** `server/src/controllers/collection.controller.ts` line 85  
**Finding:** `Payment.find({ projectId: collection._id }).sort({ createdAt: -1 }).lean()` — no `.limit()`. For large collections, this can exhaust memory and time out the HTTP response.

**Fix approach:** Stream the cursor rather than loading into memory, or add pagination with a `?limit` parameter and document the constraint.

---

### 🟢 NICE TO HAVE — `generateExternalReference` entropy is 32 bits

**File:** `server/src/services/payment.service.ts` line 15  
**Finding:** `crypto.randomBytes(4).toString("hex")` — 4 bytes = 32 bits of entropy per reference. Combined with month prefix and user suffix, collision probability is low but non-zero at volume. The unique Mongoose index on `externalReference` catches duplicates and causes the payment creation to throw — which is the right behavior — but may surprise at scale.

**Risk:** Low. The index handles it correctly. Mention in runbooks.

---

## 3. Data Integrity

### 🟡 IMPORTANT — `getMemberDashboard` assumes one active project

**File:** `server/src/services/dashboard.service.ts` line 9  
**Finding:**
```typescript
const project = await Project.findOne({ status: "active" }).sort({ createdAt: 1 });
```
If an owner creates two active projects, `getMemberDashboard` silently returns data for only the oldest one. The member dashboard appears to show a partial view without any warning.

**Fix approach:** Either enforce single-active-project at creation time (throw if another is already active), or update the dashboard to list all active projects. Document the current behavior at minimum.

---

### 🟡 IMPORTANT — Admin controller uses `any` type for query building

**File:** `server/src/controllers/admin.controller.ts`  
**Finding:** The admin members/payments search query is built with type `any`, bypassing TypeScript's safety. A typo in a field name would not be caught at compile time and would silently return wrong results.

**Fix approach:** Type the query objects as `FilterQuery<IUser>` and `FilterQuery<IPayment>` from mongoose.

---

### 🟢 NICE TO HAVE — Missed months calculation depends on `project.startDate`

**File:** `server/src/services/dashboard.service.ts` line 19  
**Finding:** `monthRange(project.startDate, new Date())` — if `startDate` is not set on the project, `monthRange` receives `undefined`. The behavior of `monthRange` with `undefined` input should be verified to not produce incorrect "missed months" counts.

---

## 4. UX Completeness

### 🟡 IMPORTANT — Navy brand remnants in admin and terms pages

**Files:**  
- `client/app/admin/page.tsx` — `text-[#0B1F3A]` and blue gradient in stat cards  
- `client/app/terms/page.tsx` lines 36, 139 — `text-[#0b1f3a]` in `h1` and `Section` h2

**Finding:** The gold & green brand refresh was applied to most of the app, but these two pages were missed. The admin overview page has blue gradient chips that clash with the forest green/gold palette.

---

### 🟡 IMPORTANT — Admin pages have no client-side role guard

**Files:** `client/app/admin/page.tsx`, `client/app/admin/members/page.tsx`, `client/app/admin/payments/page.tsx`  
**Finding:** Any authenticated user (role: "member") who navigates to `/admin` will see the full DashboardShell with admin navigation rendered, then receive API errors when data loads. There is no `if (user.role !== "admin") redirect("/dashboard")` check in any admin page.

**Risk:** Moderate UX confusion. API correctly 403s, but the user sees an error state inside an admin-looking shell rather than being cleanly redirected.

---

### 🟡 IMPORTANT — `sarafupaytz@gmail.com` email in Terms page is unconfirmed

**File:** `client/app/terms/page.tsx` line 121  
**Finding:** A code comment reads `{/* TODO before launch: confirm sarafupaytz@gmail.com is a live inbox */}`. This contact email must be working before the terms page is visible to users.

---

### 🟢 NICE TO HAVE — Terms and Privacy pages are deindexed

**File:** `client/app/terms/page.tsx` line 7  
**Finding:** `robots: { index: false, follow: false }`. This prevents search engines from indexing the terms page. This may be intentional during beta but should be reconsidered before public launch — many users search for a site's terms before trusting it.

---

### 🟢 NICE TO HAVE — Public payment return page always shows "Login or create an account" for guest payers

**File:** `client/app/payment/return/page.tsx` lines 118–130  
**Finding:** Guest payers who complete a payment are shown a prompt to create an account. This is acceptable, but the prompt renders even when the payment is failed or pending — it should only appear for completed payments.

---

## 5. Admin Readiness

### 🟡 IMPORTANT — Admin CSV export link uses `apiUrl` directly (no auth header)

**File:** `client/app/admin/payments/page.tsx` line 37  
**Finding:**
```tsx
<a href={`${apiUrl}/api/admin/export/payments`}>
```
This is a plain anchor tag navigating to the Express server directly. The browser will send the HTTP-only auth cookie only if `apiUrl` is the same origin. If the API is on a different subdomain (e.g., `api.sarafupay.co.tz`), the cookie will not be sent and the export will 401.

**Fix approach:** If API is cross-origin, proxy the export through the Next.js server (`/api/admin/export/payments` Next route that streams from Express), or use a signed temporary URL.

---

### 🟡 IMPORTANT — No pagination on admin members or payments lists

**Files:** `client/app/admin/members/page.tsx`, `client/app/admin/payments/page.tsx`  
**Finding:** Both pages fetch all records matching the search from the API. The API itself does not paginate. At 500+ members or 10,000+ payments, these pages will be slow and potentially cause timeouts.

---

### 🟢 NICE TO HAVE — No admin action log / audit trail

**Finding:** Admin actions (changing user status, closing collections) are not logged. For a payment platform, an audit trail of admin actions is important for accountability.

---

## 6. Production Essentials

### 🔴 CRITICAL — No DEPLOYMENT.md or production runbook

**Finding:** No `DEPLOYMENT.md` exists at the repository root. There is only a `client/README.md`. Before production, the following must be documented:
- Required environment variables for both client and server
- How to start/restart the server (process manager: PM2, systemd, Docker?)
- How the Next.js client is built and served
- MongoDB connection and backup strategy
- Snippe webhook URL registration steps
- How to rotate `JWT_SECRET` and `SNIPPE_WEBHOOK_SECRET`
- Health check endpoint: `GET /health`

---

### 🟡 IMPORTANT — `CLIENT_URL` is used to generate `publicPaymentLink` at collection creation time

**File:** `server/src/services/collection.service.ts` line 36  
**Finding:** `const publicPaymentLink = \`${env.CLIENT_URL}/pay/${slug}\``  
This URL is stored in the database at creation time. If `CLIENT_URL` changes (domain migration, protocol change), all existing `publicPaymentLink` values in the database become stale. The slug itself is the durable key; the link can be regenerated.

**Risk:** Low currently. Document as a migration concern.

---

### 🟡 IMPORTANT — No Content-Security-Policy header configured

**Finding:** Helmet is used in `app.ts`, but there is no explicit CSP configuration visible in the audit. Helmet's default CSP is restrictive for APIs (blocks inline scripts on API responses, which is fine), but the Next.js client has no CSP headers configured in `next.config.ts`. Without CSP, any XSS vector (however unlikely) has no browser-level mitigation.

**Fix approach:** Add `Content-Security-Policy` to `next.config.ts` headers configuration. At minimum: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`.

---

### 🟡 IMPORTANT — MongoDB lacks explicit connection error handling / retry in production

**Finding:** The server connects to MongoDB at startup. If the connection drops mid-operation in production, Mongoose will queue operations but the behavior under sustained disconnection is not explicitly handled. There is no health check that degrades gracefully when the DB is unreachable.

**Fix approach:** Add `mongoose.connection.on('error', ...)` handler and expose DB health in `GET /health`.

---

### 🟢 NICE TO HAVE — `GET /health` returns 200 but does not check DB connectivity

**Finding:** The health endpoint returns `{ status: "ok" }` unconditionally. A load balancer or monitoring tool cannot distinguish a healthy server from one that has lost its database connection.

---

## 7. Testing Gaps

### 🟡 IMPORTANT — No automated tests exist

**Finding:** No test files were found in the codebase (no `*.test.ts`, `*.spec.ts`, `__tests__/` directories). All verification has been manual.

**Highest-priority test coverage to add:**
1. `webhookVerifier.ts` — HMAC validation, replay attack rejection (timestamp > 5 min)
2. `payment.service.ts` — `createPublicPayment` duplicate prevention, paused collection blocking
3. `payment.service.ts` — `handleSnippeWebhook` idempotency (completed → completed returns early)
4. `collection.service.ts` — `getPublicCollectionBySlug` does not leak `ownerId`
5. `generateExternalReference` — produces unique, correctly-formatted references

---

### 🟡 IMPORTANT — No integration test for webhook end-to-end path

**Finding:** The full webhook path (POST → HMAC verify → payment lookup → status update → refreshCollectionStats → notify) has been tested manually. There is no automated test that would catch a regression if any step in this chain changes.

---

## Prioritized Action Plan

### Fix now (before any production traffic)

| # | Issue | File |
|---|---|---|
| 1 | `SNIPPE_API_KEY` / `SNIPPE_WEBHOOK_SECRET` must be required in env schema | `server/src/config/env.ts` |
| 2 | Restrict PII in `GET /api/payments/verify/:reference` for unauthenticated callers | `server/src/controllers/payment.controller.ts` + routes |
| 3 | Remove `dangerouslySetInnerHTML` from terms page | `client/app/terms/page.tsx` |
| 4 | Confirm `sarafupaytz@gmail.com` is a live inbox | External / Terms page |
| 5 | Write `DEPLOYMENT.md` with env vars, start commands, webhook registration | New file |

### Fix before public launch

| # | Issue | File |
|---|---|---|
| 6 | Add `client/middleware.ts` for auth-gated route protection | New file |
| 7 | Add client-side admin role guard to all `/admin` pages | `client/app/admin/**` |
| 8 | Fix navy brand remnants in admin overview and terms pages | `client/app/admin/page.tsx`, `client/app/terms/page.tsx` |
| 9 | Add a global fallback rate limiter in `app.ts` | `server/src/app.ts` |
| 10 | Fix admin CSV export to work cross-origin (proxy or same-origin) | `client/app/admin/payments/page.tsx` |
| 11 | Type admin query objects with proper Mongoose `FilterQuery` types | `server/src/controllers/admin.controller.ts` |
| 12 | Add Content-Security-Policy headers to `next.config.ts` | `client/next.config.ts` |
| 13 | Add DB health check to `GET /health` | `server/src/app.ts` |

### Fix in first post-launch sprint

| # | Issue | File |
|---|---|---|
| 14 | Replace in-memory admin dashboard aggregation with MongoDB aggregation pipeline | `server/src/services/dashboard.service.ts` |
| 15 | Add cursor streaming or pagination to CSV export | `server/src/controllers/collection.controller.ts` |
| 16 | Add pagination to admin members and payments API + UI | `server/src/controllers/admin.controller.ts` |
| 17 | Implement `notifyPaymentStatusChanged` (at minimum: log to console) | `server/src/services/notification.service.ts` |
| 18 | Write webhook verifier unit tests | New test files |
| 19 | Document `getMemberDashboard` single-active-project assumption | `server/src/services/dashboard.service.ts` |
| 20 | Re-evaluate robots noindex on Terms and Privacy pages | `client/app/terms/page.tsx`, `client/app/privacy/page.tsx` |

---

## Recommended Safest First Fixes

Start with the three that require the smallest code changes but have the highest production impact:

**1. Make Snippe env vars required** (`server/src/config/env.ts`)
Two-line change. Prevents silent misconfigured deploys. Zero risk of breaking anything.

**2. Fix `dangerouslySetInnerHTML` in Terms page** (`client/app/terms/page.tsx`)
Replace one JSX attribute with a text node. Zero functional change, eliminates an XSS pattern.

**3. Restrict PII in verify endpoint** (`server/src/controllers/payment.controller.ts`)
Return a minimal public payload for unauthenticated calls. The `/payment/return` page only needs `status`, `reference`, `amount`, `currency`, and `thankYouMessage` — not `customerPhone` or `customerEmail`. This is the most important security fix.

After those three, write `DEPLOYMENT.md` and add `client/middleware.ts` for route protection.
