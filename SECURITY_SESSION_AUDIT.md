# SarafuPay — Security & Session Audit

**Date:** 2026-05-21  
**Auditor:** Claude Sonnet 4.6  
**Branch:** `main` (clean, up to date with origin)  
**Scope:** Client auth store, session/cookie flow, API client, server auth/middleware, access control, CORS/CSP, performance

---

## 1. Executive Summary

The SarafuPay codebase has a **strong security posture**. No high-severity vulnerabilities were found. Three medium-severity issues were found — none are exploitable data-breach or authentication-bypass risks, but two of them (the duplicate `/api/auth/me` calls and the missing 401 interceptor) affect reliability and user experience in ways that also have mild security consequences. One issue (email changes via profile update) is an architectural concern for Google-linked accounts.

**Overall risk rating: LOW — Safe to ship. Three targeted fixes recommended before high-traffic launch.**

---

## 2. localStorage / sessionStorage Findings

### Result: CLEAN — Nothing to fix

| Check | Finding |
|---|---|
| `localStorage` usage | **None found** — grep across entire client returned zero results |
| `sessionStorage` usage | **None found** |
| Zustand `persist` middleware | **Not used** — `authStore.ts` uses plain `create()` with no persist, no storage |
| JWT/token in browser storage | **Not present** — token lives only in the httpOnly cookie |
| User object in browser storage | **Not present** — user object lives only in Zustand in-memory state |

The auth store is pure in-memory state. On page refresh, `useAuth` fires `authApi.me()` to restore user from the cookie. This is the correct pattern. No action needed here.

---

## 3. Cookie / Session Findings

### Result: MOSTLY CLEAN — One UX/reliability gap

**Cookie options audit (`server/src/utils/cookieHelpers.ts`):**

| Property | Value | Status |
|---|---|---|
| `httpOnly` | `true` | ✅ Correct |
| `secure` | `isProduction` (true in prod, false in dev) | ✅ Correct |
| `sameSite` | `"none"` in production, `"lax"` in dev | ✅ Correct for cross-domain SPA |
| `path` | `"/"` | ✅ Correct |
| `maxAge` | `7 * 24 * 60 * 60 * 1000` (7 days) | ✅ Reasonable |
| `clearCookie` options | Uses same `baseCookieOptions()` without `maxAge` | ✅ Correct — `clearCookie` needs matching attributes |
| OAuth state cookie | `httpOnly`, 5-min TTL, cleared immediately on callback | ✅ Correct CSRF protection |

**Gap found — Logout requires a valid session (MEDIUM-LOW):**

```ts
// auth.routes.ts
router.post("/logout", protect, logout);
```

The `/api/auth/logout` endpoint has `protect` middleware. If the user's JWT has already expired or the cookie was cleared by the browser (e.g., private browsing session ended), calling logout returns `401`. The client-side `useAuth.logout()` catches this silently and still navigates to `/login`, so the user ends up on the login page. But the server cookie is NOT cleared in this case because the request never reaches `clearAuthCookie`.

In practice this is not a security hole — an expired or missing cookie means the session is already dead. But it's worth noting that `protect` on logout is unusual and could confuse users in some edge cases.

**Recommendation:** Remove `protect` from the logout route. The logout handler only calls `clearAuthCookie(res)` — it's safe to run without authentication.

---

## 4. Auth State Behavior Findings

### Result: MOSTLY CLEAN — One reliability issue

| Check | Finding |
|---|---|
| Page refresh restores session via `/api/auth/me` | ✅ `useAuth` calls `authApi.me()` when `hydrated = false` |
| Hydrated guard prevents duplicate me() calls | ✅ `if (hydrated) return` in the useEffect |
| Logout clears in-memory user state | ✅ `setUser(null)` called before redirect |
| Inactive user blocked on every request | ✅ `protect` middleware checks `user.isActive` on each protected call |
| Expired JWT redirects to login | ✅ me() fails → setUser(null) → DashboardShell redirects |
| Admin/member role redirects | ✅ Both DashboardShell and AdminGuard handle role mismatches |

**Gap found — No 401 interceptor in api.ts (MEDIUM):**

```ts
// client/lib/api.ts — current
if (!response.ok) {
  throw new ApiError(message, { ... });
}
```

If a user's session expires or their account is deactivated while they're actively browsing (not on a fresh page load), subsequent API calls will return `401`. The client throws an `ApiError`, which each page/hook handles differently — some show an error state, some silently fail. There is no central handler that says "if 401, clear user state and redirect to /login."

This means a deactivated user can remain on the dashboard seeing stale cached data until they navigate or refresh. They cannot access new data (the server blocks every request), but the UI doesn't actively kick them out.

**Recommendation:** Add a `401` check in the `api` function. On `401`, clear the auth store and redirect to `/login?session=expired`. This makes the security enforcement visible and responsive.

---

## 5. Backdoor / Access Control Findings

### Result: CLEAN — All access controls are correct

**Server-side route protection:**

| Route group | Protection | Notes |
|---|---|---|
| `POST /api/auth/register` | Rate-limited (20/15min), Zod-validated | ✅ |
| `POST /api/auth/login` | Rate-limited (20/15min), Zod-validated | ✅ |
| `GET /api/auth/me` | `protect` (JWT + isActive check) | ✅ |
| `PATCH /api/auth/profile` | `protect` + Zod-validated | ✅ |
| `PATCH /api/auth/change-password` | `protect` + Zod-validated | ✅ |
| All `/api/admin/*` routes | `router.use(protect, requireAdmin)` — applied to all sub-routes | ✅ |
| All `/api/collections/*` protected routes | `protect` on each | ✅ |
| `GET /api/collections/public/:slug` | Intentionally public, rate-limited | ✅ |
| `POST /api/payments/create-public-session` | Intentionally public, rate-limited | ✅ |
| `GET /api/payments/verify/:reference` | Intentionally public (receipt page) | See note below |
| All other `/api/payments/*` | `protect` | ✅ |
| `/api/dashboard/member` | `protect` | ✅ |
| `/api/dashboard/admin` | `protect + requireAdmin` | ✅ |
| `/api/projects` (read) | `protect` | ✅ |
| `/api/projects` (write/delete) | `protect + requireAdmin` | ✅ |

**Ownership checks:**

| Resource | Check | Code |
|---|---|---|
| Collection CRUD | Owner enforced in service layer via `ownerId: req.user!._id` | ✅ |
| Collection payments/summary/export | Owner enforced in service layer | ✅ |
| Payment detail | `Payment.findOne({ _id, userId: req.user!._id })` | ✅ |
| Payment retry | `Payment.findOne({ _id: paymentId, userId: req.user!._id })` | ✅ |
| My payments list | Queried by `req.user!._id` | ✅ |

**`/api/payments/verify/:reference` — Public receipt endpoint:**

This endpoint is intentionally unauthenticated. It exposes: `_id, status, amount, currency, customerName, externalReference, snippeReference, paidAt, createdAt, projectId.title`. It explicitly excludes `customerPhone`, `customerEmail`, `payerMessage`, and raw webhook payload. The reference is a UUID, so it is not guessable. Risk is acceptable for a payment receipt page.

**Profile update — Email change concern (LOW-MEDIUM):**

```ts
// server/src/controllers/auth.controller.ts
export const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().regex(...).optional(),
  email: z.string().email().optional(),  // ← email is allowed
  ...
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user!._id, req.body, { ... });
  ...
});
```

A logged-in user can change their own email without reauthentication. For Google-linked accounts, if the user changes their email to something other than their Google email, the next Google login will not find a match on `googleId` OR `email`, and will create a duplicate account. The DB unique index will also throw if they try to change to an already-used email. This is not an authentication bypass but it is an architectural footgun for Google users specifically.

**Recommendation:** Remove `email` from `profileSchema` or add a separate, confirmed "change email" flow. At minimum, document this behavior.

---

## 6. CORS / Security Headers Findings

### Result: CLEAN — No action needed

| Control | Value | Status |
|---|---|---|
| CORS origin check | Whitelist-based Set, no wildcard | ✅ |
| `credentials: true` with safe origins | Only exact-match origins allowed | ✅ |
| Helmet | Applied globally | ✅ |
| `Content-Security-Policy` | Comprehensive, scoped PostHog domains, no wildcards | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() | ✅ |
| No secrets in client code | Confirmed — GOOGLE_CLIENT_SECRET, SNIPPE_WEBHOOK_SECRET, JWT_SECRET never referenced in client | ✅ |
| MongoSanitize | Applied to body, params, query on every request | ✅ |
| Zod validation | Strips unknown fields — only schema-defined fields reach controllers | ✅ |
| Trust proxy | `app.set("trust proxy", 1)` set — correct for reverse proxy deployments | ✅ |

**CORS dev allowlist:**

```ts
// server/src/app.ts
const allowedOrigins = new Set([
  env.CLIENT_URL,
  ...(isProduction ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"])
]);
```

Dev origins are excluded in production. ✅

---

## 7. Performance — Auth Call Findings

### Result: ONE ISSUE FOUND — Duplicate /api/auth/me calls (MEDIUM)

**Problem:** `useAuth` fires `authApi.me()` inside a `useEffect` that runs in every component that calls `useAuth`. All components share the same Zustand store, so the `hydrated` flag is shared — but only *after* the first call completes. If multiple components mount simultaneously (which happens on every dashboard page load — DashboardShell, AppSidebar, and the page component all mount at once and all call `useAuth`), they all see `hydrated = false` at the same moment and all independently fire `authApi.me()`.

**Affected components that call `useAuth`:**
- `DashboardShell` (wraps every dashboard page)
- `AppSidebar` (rendered inside DashboardShell)
- `MobileNav` (rendered inside DashboardShell, calls `useAuth` for logout)
- `AdminGuard` (wraps admin pages)
- `dashboard/page.tsx`
- `dashboard/profile/page.tsx`
- `payment/return/page.tsx`

On the main dashboard page, at least 4 components mount simultaneously — this produces up to 4 parallel `GET /api/auth/me` requests on every page load.

**Fix:** Move the `me()` call into a single `AuthProvider` that wraps the root layout. All components then read from the store without triggering duplicate requests. Alternatively, use a module-level singleton promise to deduplicate concurrent me() calls.

---

## 8. Risk Rating Summary

| # | Issue | Area | Risk | Action |
|---|---|---|---|---|
| 1 | Duplicate `/api/auth/me` calls on mount | Performance | Medium | Fix — Phase 2 |
| 2 | No 401 interceptor — expired sessions leave broken UI | UX/Security | Medium | Fix — Phase 3 |
| 3 | `updateProfile` allows email changes without reauthentication | Architecture | Low-Medium | Fix — Phase 4 |
| 4 | `logout` route protected by `protect` — fails on expired cookie | UX | Low | Fix — Phase 3 |
| 5 | localStorage — None found | — | None | No action |
| 6 | Zustand persist — Not used | — | None | No action |
| 7 | JWT in browser storage — Not found | — | None | No action |
| 8 | Cookie security (httpOnly, secure, sameSite) | Cookie | None | No action |
| 9 | OAuth state CSRF protection | Auth | None | No action |
| 10 | Admin access control | Authorization | None | No action |
| 11 | Collection/payment ownership | Authorization | None | No action |
| 12 | CORS, CSP, security headers | Network | None | No action |
| 13 | MongoSanitize + Zod validation | Injection | None | No action |

---

## 9. Exact Files to Change

### Phase 2 — Eliminate duplicate /api/auth/me calls

| File | Change |
|---|---|
| `client/store/authStore.ts` | Add `isLoading` flag and module-level `hydrationPromise` singleton |
| `client/hooks/useAuth.ts` | Remove the `useEffect` that calls `me()` — hydration moved to provider |
| `client/app/layout.tsx` (or a new `AuthProvider`) | Add single top-level effect that calls `me()` exactly once on app mount |

### Phase 3 — 401 interceptor + logout fix

| File | Change |
|---|---|
| `client/lib/api.ts` | Add 401 check: on 401, call `useAuthStore.getState().setUser(null)` and redirect to `/login?session=expired` |
| `server/src/routes/auth.routes.ts` | Remove `protect` from `logout` route |
| `client/hooks/useAuth.ts` | Make client-side logout fire-and-forget (don't await the API call for redirect) |

### Phase 4 — Email change protection

| File | Change |
|---|---|
| `server/src/controllers/auth.controller.ts` | Remove `email` from `profileSchema` |
| `client/lib/validations.ts` | If `profileSchema` includes email on client side, remove it |

---

## 10. Safe Phased Implementation Plan

### Phase 2: Fix duplicate /api/auth/me calls (highest impact)

**Approach A — Singleton promise (minimal change, no new files):**

Add a module-level singleton to `authStore.ts`. The first component to call `useAuth` fires `me()` and stores the promise. All subsequent callers await the same promise. No new files needed.

```ts
// authStore.ts addition
let hydrationPromise: Promise<void> | null = null;

export function hydrateAuth(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = authApi.me()
    .then(res => useAuthStore.getState().setUser(res.data.user))
    .catch(() => useAuthStore.getState().setUser(null))
    .finally(() => useAuthStore.getState().setHydrated(true));
  return hydrationPromise;
}
```

Then in `useAuth.ts`, replace the `useEffect` with a call to `hydrateAuth()`.

**Approach B — Root layout provider (cleaner, preferred):**

Create a `client/components/auth/AuthProvider.tsx` that calls `me()` once on mount and provides auth state via the store. Mount it in `client/app/layout.tsx`. Remove the hydration effect from `useAuth.ts` entirely. `useAuth` becomes a pure store selector.

**Recommended: Approach B** — cleaner separation, easier to reason about, no module-level side effects.

### Phase 3: 401 interceptor + logout hardening

In `api.ts`, after checking `!response.ok`, add:
```ts
if (response.status === 401) {
  // Clear in-memory auth state
  const { setUser, setHydrated } = useAuthStore.getState();
  setUser(null);
  setHydrated(true); // hydration is done — user is just not authenticated
  // Redirect to login (only if in browser)
  if (typeof window !== "undefined") {
    window.location.replace("/login?session=expired");
  }
}
```

Note: `useAuthStore.getState()` works outside of React components — this is a valid Zustand pattern.

For logout: remove `protect` from the logout route. The handler only clears a cookie — no auth needed for that operation.

### Phase 4: Remove email from profile update

Remove `email` from `profileSchema` on both server and client. If a user needs to change email, that can be a future feature with email verification.

---

## 11. What NOT to Change

- **Payment logic** — createPublicPayment, createContributionPayment, retryPayment ownership checks are all correct. Do not touch.
- **Webhook logic** — HMAC verification with `crypto.timingSafeEqual` and 300s replay window is correct. Do not touch.
- **Google OAuth flow** — State cookie CSRF, token exchange, profile fetch, account linking, inactive user check are all correct. Do not touch.
- **Cookie configuration** — httpOnly, secure, sameSite are all correct. Do not change.
- **Admin middleware** — `protect + requireAdmin` stacked correctly on all admin routes. Do not change.
- **CORS/CSP** — Whitelist-based, comprehensive. Do not add wildcards.
- **MongoSanitize + Zod** — Correctly applied to all routes. Do not remove.
- **Rate limiters** — Correctly placed on auth, public payment, and webhook routes. Do not reduce limits.
- **Zustand auth store** — Do NOT add `persist` middleware. The current in-memory-only pattern is intentional and correct.
- **PostHog configuration** — autocapture disabled, session recording disabled, sensitive path stripping in place. Do not change.

---

## 12. Manual Test Checklist (After Implementation)

1. Email login works — redirects to /dashboard
2. Google login works — redirects to /dashboard (or /admin for admin account)
3. Refresh dashboard — session restored, no flicker, no duplicate network calls visible in DevTools
4. Logout — redirects to /login, cookie cleared, next navigation to /dashboard redirects back to /login
5. Expired/invalid cookie — next API call triggers redirect to /login (test by manually deleting the cookie)
6. Deactivated account — blocking visible immediately when browsing (not just on next page load)
7. No localStorage auth data — open DevTools Storage → localStorage is empty
8. Member cannot access /admin — redirects to /dashboard
9. Admin redirected to /admin — accessing /dashboard as admin redirects to /admin
10. Collection ownership — cannot access another user's collection ID via direct URL
11. Payment ownership — cannot access another user's payment ID via GET /api/payments/:id
12. Public pay page works — /pay/[slug] loads and accepts payment
13. Webhook still works — Snippe callback updates payment status
14. PostHog still works — pageviews fire, no sensitive data in events
15. Build passes — npm run lint (0 errors), npm run build (26 routes, 0 errors)
16. DevTools Network — verify only ONE /api/auth/me call on dashboard load (after Phase 2 fix)
17. DevTools Network — verify 401 response on expired cookie triggers /login redirect (after Phase 3 fix)
18. Profile save — email field not editable (after Phase 4 fix)
