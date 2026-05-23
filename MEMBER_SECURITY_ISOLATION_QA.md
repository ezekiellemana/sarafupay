# Member Security & Data Isolation QA Report

**Date:** 2026-05-23
**Release baseline:** v1.10.3-support-email-update / v1.11.0-custom-domain-migration
**Domain:** https://sarafupay.app / https://api.sarafupay.app
**Auditor:** Claude Sonnet 4.6 (code audit + fix)

---

## 1. Summary

Full code audit of member dashboard security, data isolation, API ownership enforcement, session handling, CORS, and public collection data exposure. One functional bug found and fixed (stale `publicPaymentLink` after domain migration). All security controls — route protection, data isolation, profile update field restriction, admin segregation, and session management — passed without changes.

**Verdict: GO** — with one bug fixed (see section 5).

---

## 2. Test Accounts / Data

This audit was performed via static code analysis of the full server and client codebases. Manual retest checklist is provided in section 8 for two-account isolation verification on production.

| Account | Role | Expected access |
|---|---|---|
| Member A | member | Own collections, own payments, own profile |
| Member B | member | Own collections, own payments, own profile |
| Admin | admin | All admin routes; redirected from member dashboard |

---

## 3. Routes Tested

### Client-side route protection (DashboardShell)

| Route | Guards | Logged-out | Member | Admin |
|---|---|---|---|---|
| `/dashboard` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/collections` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/collections/new` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/collections/[id]` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/collections/[id]/edit` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/payments` | DashboardShell | → `/login` | ✓ | → `/admin` |
| `/dashboard/profile` | DashboardShell | → `/login` | ✓ | → `/admin` |

**How it works:** `DashboardShell` renders a spinner until `hydrated = true`. The redirect `useEffect` exits early while `!hydrated`, so no race condition exposes content. On hydration: `!user` → `/login`; `admin on member page` → `/admin`; `member on admin page` → `/dashboard`.

### Server-side API protection (protect middleware)

`protect` in `auth.middleware.ts`:
- Reads JWT from httpOnly cookie (`env.COOKIE_NAME`)
- Verifies signature with `JWT_SECRET`
- Fetches user from DB
- Checks `user.isActive` — inactive users get 401
- Attaches `req.user`

All member API routes require `protect`. All admin API routes require `protect` + `requireAdmin` via `router.use(protect, requireAdmin)`.

---

## 4. Endpoint Ownership Audit

### Collection endpoints

| Endpoint | Ownership check | How |
|---|---|---|
| `GET /api/collections/my` | ✓ | `Project.find({ ownerId: req.user!._id })` |
| `POST /api/collections` | ✓ | `createCollection(req.user!._id, ...)` |
| `GET /api/collections/:id` | ✓ | `Project.findOne({ _id: id, ownerId })` — 404 if not owner |
| `PATCH /api/collections/:id` | ✓ | `Project.findOne({ _id: id, ownerId })` — 404 if not owner |
| `DELETE /api/collections/:id` | ✓ | `Project.findOne({ _id: id, ownerId })` — 404 if not owner |
| `GET /api/collections/:id/payments` | ✓ | `Project.findOne({ _id: id, ownerId })` — 404 if not owner |
| `GET /api/collections/:id/summary` | ✓ | `Project.findOne({ _id: id, ownerId })` — 404 if not owner |
| `GET /api/collections/:id/export/csv` | ✓ | `Project.findOne({ _id: id, ownerId: req.user!._id })` — 404 if not owner |
| `GET /api/collections/public/:slug` | public | Returns only `visibility: "public"` collections; strips `ownerId` from response |

### Payment endpoints

| Endpoint | Ownership check | How |
|---|---|---|
| `GET /api/payments/my-payments` | ✓ | `Payment.find({ userId: req.user!._id })` |
| `GET /api/payments/my-summary` | ✓ | `getMemberDashboard(req.user!._id)` |
| `GET /api/payments/:id` | ✓ | `Payment.findOne({ _id: id, userId: req.user!._id })` — 404 if not owner |
| `POST /api/payments/retry/:paymentId` | ✓ | `Payment.findOne({ _id: paymentId, userId: req.user!._id })` — 404 if not owner |
| `GET /api/payments/verify/:reference` | public | Returns only safe receipt fields (no phone, email, rawWebhookPayload) |
| `POST /api/payments/create-public-session` | public | No auth required; ownership not applicable |

### Dashboard endpoint

| Endpoint | Isolation | How |
|---|---|---|
| `GET /api/dashboard/member` | ✓ | `getMemberDashboard(req.user!._id)` — filters payments by `{ userId, projectId }` |
| `GET /api/dashboard/admin` | admin-only | `protect + requireAdmin` |

### Auth/Profile endpoints

| Endpoint | Isolation | How |
|---|---|---|
| `PATCH /api/auth/profile` | ✓ | Updates `req.user!._id` only; Zod strips unknown fields |
| `PATCH /api/auth/change-password` | ✓ | Reads `req.user!._id`; bcrypt comparison |
| `GET /api/auth/me` | ✓ | Returns `serializeUser(req.user!)` |

### Admin endpoints

All admin routes use `router.use(protect, requireAdmin)` — every route in `admin.routes.ts` requires both valid session AND `role === "admin"`. A member calling any `/api/admin/*` route receives 403.

---

## 5. Bugs Found

### BUG — Stale `publicPaymentLink` after domain migration

**Severity:** Medium — functional, affects user experience, not a security issue

**Location:**
- `server/src/services/collection.service.ts` — `getOwnerCollections`, `getCollectionByIdForOwner`, `getCollectionSummary`
- `server/src/controllers/collection.controller.ts` — `exportCollectionCsvHandler` (not affected — CSV doesn't show the link)

**Root cause:**
When a collection is created, `publicPaymentLink` is stored in MongoDB as:
```ts
const publicPaymentLink = `${env.CLIENT_URL}/pay/${slug}`;
```
Collections created when `CLIENT_URL` was `https://sarafupay-client.vercel.app` have that old URL stored in the database. After domain migration, the stored value is never updated.

**Impact:**
- Collections list: "Copy Link" button copies old Vercel domain URL
- Collection detail page: PaymentLinkCard displays and copies old URL
- After creating a collection: link shown/copied from new creation response uses current `CLIENT_URL` (correct) but existing collections use stale stored value

**Fix applied:**
Computed `publicPaymentLink` from current `env.CLIENT_URL` + `slug` in all three read functions. The stored DB value is unchanged (no migration needed — it's now treated as a stale cache). Future reads always return the current domain.

```ts
// getOwnerCollections
return collections.map((c) => ({ ...c, publicPaymentLink: `${env.CLIENT_URL}/pay/${c.slug}` }));

// getCollectionByIdForOwner
return { ...collection, publicPaymentLink: `${env.CLIENT_URL}/pay/${collection.slug}` };

// getCollectionSummary
collection: { ...collection, publicPaymentLink: `${env.CLIENT_URL}/pay/${collection.slug}` }
```

**Why it's safe:** The `slug` is uniquely generated at creation and never changes. `env.CLIENT_URL` is the authoritative frontend URL. No database records were modified.

---

## 6. Fixes Made

| File | Change |
|---|---|
| `server/src/services/collection.service.ts` | `getOwnerCollections`, `getCollectionByIdForOwner`, `getCollectionSummary` — recompute `publicPaymentLink` from `CLIENT_URL` |

Server TypeScript build: **clean** (`tsc --noEmit` — no errors).
Client: **no changes**.

---

## 7. Remaining Risks / Notes

### Profile update field restriction — VERIFIED SAFE

Malicious PATCH body test:
```json
{
  "role": "admin",
  "isActive": true,
  "passwordHash": "abc",
  "googleId": "fake",
  "email": "evil@example.com"
}
```

The `validate(profileSchema)` middleware runs before `updateProfile`. It calls `schema.safeParse(req.body)` and then **replaces `req.body` with `result.data`** (line 19 of `validate.middleware.ts`). Zod strips all unknown fields by default. Only `fullName`, `phoneNumber`, `businessName`, `bio`, `avatarUrl` can reach `findByIdAndUpdate`. All five malicious fields are silently stripped. **No privilege escalation possible.**

### Public collection data — VERIFIED SAFE

`getPublicCollectionBySlug` strips `ownerId` from the response. If `showContributors` is true, contributor names are truncated (`John D.` — never full name) and only `name`, `amount`, `paidAt` are included (no phone, email, internal IDs).

`verifyPayment` (public receipt endpoint) returns only: `_id`, `status`, `amount`, `currency`, `customerName`, `externalReference`, `snippeReference`, `paidAt`, `createdAt`, `projectId.title`. No phone, no email, no `rawWebhookPayload`.

### CORS — VERIFIED SAFE

`allowedOrigins` is a `Set` containing `env.CLIENT_URL` and (in dev only) localhost variants. No wildcard. `credentials: true`. Cross-origin requests from any other origin receive a CORS error, not a 200.

### Admin segregation — VERIFIED SAFE

- Client: `DashboardShell` with `admin={true}` redirects non-admin users to `/dashboard` on hydration. `AdminGuard` renders nothing until admin role confirmed.
- Server: `router.use(protect, requireAdmin)` on all admin routes — a member cannot reach any `/api/admin/*` endpoint regardless of client-side behavior.

### httpOnly cookie — VERIFIED

`setAuthCookie` uses `baseCookieOptions()`:
```ts
{ httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", path: "/" }
```
No JWT/token in localStorage or sessionStorage anywhere in the codebase.

### Session expiry — VERIFIED

Expired cookie: `protect` calls `jwt.verify()` which throws if expired → 401 → 401 interceptor in `api.ts` (if `hydrated && user !== null`) redirects to `/login?error=session_expired`. Clean UX.

Inactive user: `protect` checks `user.isActive` after DB fetch — deactivated users cannot use a valid cookie.

### Member dashboard data source — BY DESIGN

`getMemberDashboard` finds the globally first active project (monthly contribution model). Payments are always filtered by `{ userId, projectId }` — no cross-user data leaks. This is the original "chama contribution" flow; the Collections feature is a separate, properly isolated system.

### `publicPaymentLink` on collection creation

Newly created collections (post-migration) will have `sarafupay.app` stored correctly. The fix ensures existing pre-migration collections show the correct URL without any database migration.

---

## 8. Manual Retest Checklist

### Route protection

- [ ] Navigate to `https://sarafupay.app/dashboard` while logged out → redirects to `/login`
- [ ] Navigate to `https://sarafupay.app/dashboard/collections` while logged out → redirects to `/login`
- [ ] Navigate to `https://sarafupay.app/dashboard/collections/new` while logged out → redirects to `/login`
- [ ] Log in as admin → navigating to `https://sarafupay.app/dashboard` redirects to `/admin`
- [ ] `curl https://api.sarafupay.app/api/collections/my` (no cookie) → 401

### Data isolation (two member accounts)

- [ ] Log in as Member A, note a collection ID from your dashboard
- [ ] Log in as Member B, try `GET /api/collections/<memberA-id>` → 404
- [ ] Member B tries `PATCH /api/collections/<memberA-id>` with any body → 404
- [ ] Member B tries `DELETE /api/collections/<memberA-id>` → 404
- [ ] Member B tries `GET /api/collections/<memberA-id>/payments` → 404
- [ ] Member B tries `GET /api/collections/<memberA-id>/export/csv` → 404
- [ ] Member B's `/dashboard/payments` shows only Member B's payments (none of Member A's)
- [ ] Member B tries `GET /api/payments/<memberA-payment-id>` → 404
- [ ] Member B tries `POST /api/payments/retry/<memberA-payment-id>` → 404

### Profile update field restriction

- [ ] `PATCH /api/auth/profile` with `{ "role": "admin", "isActive": false, "email": "evil@x.com" }` using Member A's session → 200 returned but `role`, `isActive`, `email` unchanged; only allowed fields updated
- [ ] Profile page → save form → verify email field is read-only and not sent in PATCH payload (check browser DevTools Network tab)

### Payment link domain fix

- [ ] Log in as Member A, open an existing (pre-migration) collection detail page
- [ ] Click "Copy Payment Link" → clipboard should contain `https://sarafupay.app/pay/[slug]` (not old Vercel URL)
- [ ] Collections list → click copy icon on an existing collection → should show `sarafupay.app` domain
- [ ] Create a new collection → link shown after creation shows `sarafupay.app`

### Public payment page

- [ ] `https://sarafupay.app/pay/[active-slug]` loads without login
- [ ] No owner phone, email, or internal IDs visible in the page source or API response
- [ ] `https://sarafupay.app/pay/[paused-slug]` shows paused message and payment form disabled
- [ ] `https://sarafupay.app/pay/[closed-slug]` shows closed message

### Session / security

- [ ] Check browser DevTools → Application → Local Storage / Session Storage → no JWT or user token stored
- [ ] Log out → auth cookie cleared → navigating to `/dashboard` redirects to `/login`
- [ ] Deactivate Member A via admin panel → Member A's existing session returns 401 on next API call → redirected to `/login`
- [ ] Member A tries `GET /api/admin/members` → 403

### Custom domain

- [ ] `https://api.sarafupay.app/health` → `{ "status": "ok", "db": "connected" }`
- [ ] Login works on `https://sarafupay.app` (no CORS errors in DevTools)
- [ ] Google OAuth login works with `sarafupay.app` callback
- [ ] Webhook delivers to `https://api.sarafupay.app/api/webhooks/snippe`
- [ ] Payment return page is `https://sarafupay.app/payment/return`

---

## 9. Final Recommendation

**GO**

All security controls are correctly implemented:
- Every member-owned resource is scoped by `userId` / `ownerId` at the service layer
- Admin segregation is enforced both client-side and server-side
- Profile updates cannot escalate privileges — Zod + validate middleware strips all sensitive fields
- Public endpoints expose only safe fields
- CORS is strict (no wildcard + credentials)
- Session is httpOnly cookie only — no localStorage leakage
- Inactive users are blocked server-side on every request

One functional bug fixed (stale `publicPaymentLink` domain). No security vulnerabilities found.

**Suggested tag after manual retest passes:** `v1.11.1-member-security-isolation-qa`
