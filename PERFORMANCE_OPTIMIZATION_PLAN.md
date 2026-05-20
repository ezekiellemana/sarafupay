# SarafuPay — Performance Optimization Plan

> **Status:** Awaiting approval before any code changes.  
> **Scope:** Backend query optimization, Redis caching, frontend bundle, auth speed, API response times.  
> **Hard constraints:** Payment logic untouched · Webhook verification untouched · Snippe flow untouched · No DB migration · No significant cost increase.

---

## What was inspected

| Layer | Files read |
|---|---|
| Models | User.model.ts, Project.model.ts, Payment.model.ts, ContributionPlan.model.ts |
| Routes | auth, project, collection, payment, dashboard, admin, webhook |
| Services | payment.service.ts, collection.service.ts, dashboard.service.ts |
| Middleware | auth.middleware.ts, admin.middleware.ts, rateLimit.middleware.ts |
| Entry point | app.ts, server.ts |
| Frontend | InsightsSection, DashboardShell, LoginForm, RegisterForm, admin pages |
| Packages | server/package.json, client/package.json |

---

## Critical findings before the plan

These are the most damaging issues found during inspection:

1. **Auth middleware hits the database on every single protected request** — `User.findById(decoded.id)` runs before every controller, no cache, no session store.
2. **Admin dashboard runs 12 parallel aggregations with no caching** — every page load re-computes totals, monthly chart, recent payments, all projects.
3. **`Project.find()` in admin dashboard is fully unbounded** — returns every project in the DB with no limit.
4. **CSV export loads all payments into Node memory** — two endpoints: `/admin/export/payments` and `/collections/:id/export/csv`. Will crash under volume.
5. **`refreshCollectionStats` runs a full aggregation pipeline synchronously on every payment completion** — this is write amplification on the hot path.
6. **No caching layer anywhere** — no Redis, no HTTP cache headers, no response memoization.
7. **`createdAt` is missing from all indexes** — every `.sort({ createdAt: -1 })` causes a collection scan.

---

## Phase 1 — MongoDB Index Optimization

### 1.1 — Indexes to add

#### User collection

| Index | Reason |
|---|---|
| `{ role: 1 }` | Admin member listing filters by role constantly |
| `{ isActive: 1 }` | `User.countDocuments({ isActive: true })` in admin dashboard, 12× per load |
| `{ role: 1, isActive: 1 }` | Compound for the common combined filter |
| `{ createdAt: -1 }` | Recent user listing in admin feed |

**Existing:** `email` (unique), `phoneNumber` (unique) — keep as-is.

#### Project collection

| Index | Reason |
|---|---|
| `{ createdAt: -1 }` | Every `Project.find().sort({ createdAt: -1 })` scans without this |
| `{ ownerId: 1, createdAt: -1 }` | `getOwnerCollections` sorts by date per owner |

**Existing:** `{ status: 1 }`, `{ slug: 1 }` (unique, sparse), `{ ownerId: 1, status: 1 }`, `{ visibility: 1, status: 1 }` — keep.  
**Note:** `createdBy` field referenced in project.controller but `ownerId` does the same job — no duplicate index needed.

#### Payment collection

| Index | Reason |
|---|---|
| `{ createdAt: -1 }` | All payment listing endpoints sort by createdAt |
| `{ projectId: 1, createdAt: -1 }` | `getCollectionPayments` and CSV export need this |
| `{ ownerId: 1, createdAt: -1 }` | Admin payment listing filtered by owner |

**Existing indexes to keep:** `{ userId, projectId, monthPaidFor, status }`, `{ ownerId, status }`, `{ projectId, status }`, `{ externalReference }` (unique), `{ snippeReference }` (unique, sparse), `{ snippeSessionId }` (sparse).

**Note on the 4-field index** `{ userId, projectId, monthPaidFor, status }`: This is selective and correct for duplicate-payment prevention. Keep it.

### 1.2 — `.lean()` gaps to fix (read-only queries only)

| File | Function | Fix |
|---|---|---|
| dashboard.service.ts | `getMemberDashboard` Payment.find() | Add `.lean()` |
| payment.service.ts | `verifyLocalPayment` after `.populate()` | Add `.lean()` |
| dashboard.service.ts | `getAdminDashboard` recent payment finds | Already have `.lean()` on most — verify |
| collection.service.ts | `updateCollection` findOne before save | Leave as-is — needs Mongoose doc to call `.save()` |

**Rule:** Never add `.lean()` before a `.save()` call. Only apply to terminal read queries.

### 1.3 — Unbounded queries to paginate

| Endpoint | Current | Fix |
|---|---|---|
| `GET /api/admin/members` | `User.find(query)` — all members | Default limit 50, cursor-based or skip/limit |
| `GET /api/admin/collections` | `Project.find()` — all projects | Default limit 50 |
| `GET /api/collections/:id/payments` | `Payment.find()` unbounded | Default limit 50 |
| `GET /api/payments/my-payments` | `Payment.find()` no limit | Default limit 50 |
| Dashboard `getAdminDashboard` | `Project.find().lean()` all | `.limit(100)` since it's only counting — or replace with `Project.countDocuments()` |

**CSV export** (`/admin/export/payments`, `/collections/:id/export/csv`):  
Load in 500-document batches via cursor, stream to response. Use `res.setHeader("Content-Type", "text/csv")` + `res.write()` per batch. This is safe even with 10,000+ payments.

### 1.4 — ContributionPlan model

No route endpoints use this model. It can be safely ignored for now — no indexes needed until it's actively used.

### 1.5 — Risks

- Adding indexes is safe and does not require downtime on MongoDB Atlas (builds in background).
- Paginating previously-unbounded endpoints is a minor **breaking change on the admin frontend** — the admin pages will need to send `?page=` or `?limit=` parameters, or the response shape changes. Since admin pages are internal-only, this is manageable.
- `.lean()` additions carry no risk on read-only functions; will error if added before `.save()` by mistake (caught by tests).

---

## Phase 2 — Frontend Request / Query Cleanup

### 2.1 — Auth duplicate call elimination

**Current behaviour (already partially fixed):**  
`setHydrated(true)` is called in LoginForm/RegisterForm before `router.push()`, so the dashboard's `useAuth` hook skips the `/api/auth/me` re-fetch on mount. This is working correctly.

**Remaining issue:** Every page under `/dashboard` and `/admin` that calls `useAuth` triggers `authApi.me()` if `!hydrated`. If the user navigates between dashboard sub-pages without a full reload, this is already prevented by Zustand's `hydrated` flag.

**Action:** No code change needed here. Verify by checking DevTools Network tab for duplicate `/api/auth/me` calls during SPA navigation — should be zero after initial load.

### 2.2 — Admin page data fetching

Current pattern on every admin page:
```tsx
useEffect(() => {
  api<T>("/api/admin/X").then(...).catch(...);
}, [refreshKey]);
```

This fires on mount and on manual refresh only (`once: true` via `refreshKey`). This is already minimal — no polling, no duplicate calls.

**Action:** No change needed. The pattern is correct.

### 2.3 — Lazy-loading heavy landing components

| Component | Size concern | Action |
|---|---|---|
| `InsightsSection` (Recharts) | Recharts is ~200KB gzipped | Lazy-load with `next/dynamic` + `ssr: false` |
| `JourneySection` (framer-motion) | Framer-motion already in bundle | No action — already used globally |
| `FloatingBlobBackground` | Pure CSS, server component | Already optimized |

**Recharts lazy-load approach:**
```tsx
// In the landing page (app/page.tsx or landing layout):
const InsightsSection = dynamic(
  () => import("@/components/landing/InsightsSection").then(m => ({ default: m.InsightsSection })),
  { ssr: false, loading: () => <div className="h-96" /> }
);
```

This removes Recharts from the initial bundle. Users who never scroll to Insights (above-fold bounce) never download it.

**Risk:** Low. The component is already `"use client"`. SSR is not needed since it's data-display only.

### 2.4 — Image / logo strategy

`BrandLogo` renders an `<Image>` or `<img>` with an SVG. Verify:
- SVG logos should be inline or served with `Cache-Control: max-age=31536000` via Vercel's static asset pipeline (automatic).
- No action needed unless logos are being served from a non-CDN origin.

### 2.5 — Route transition optimization

Vercel + Next.js App Router pre-fetches `<Link>` targets on hover by default. No action needed.

**One potential win:** After successful login, prefetch `/dashboard` before `router.push()`:
```tsx
router.prefetch("/dashboard");
// then after setHydrated(true):
router.push("/dashboard");
```
This is a 1-line change per auth form and reduces the perceived transition time.

---

## Phase 3 — Upstash Redis Cache Integration

### 3.1 — Why Upstash

| Property | Value |
|---|---|
| Cost | Free tier: 10,000 commands/day. Pay-as-you-go: $0.2 per 100K commands |
| Latency | ~1ms within same region (US East or EU) |
| Model | Serverless — no persistent connection overhead |
| SDK | `@upstash/redis` — simple `get`/`set`/`del` with JSON serialization |
| Integration | One env var `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |

**No additional DigitalOcean resources needed.** Upstash is an external managed service.

### 3.2 — Cache candidates

| Cache key pattern | TTL | Endpoint | Notes |
|---|---|---|---|
| `admin:summary` | 45s | `GET /api/admin/summary` | 12-aggregate dashboard — expensive |
| `admin:activity` | 30s | `GET /api/admin/activity` | 3 queries + batching |
| `admin:settings` | 300s | `GET /api/admin/settings` | Static env var read |
| `admin:audit` | 120s | `GET /api/admin/system-audit` | Boolean checks |
| `admin:members:list:{hash}` | 30s | `GET /api/admin/members?search=&page=` | Hash from query params |
| `collection:slug:{slug}` | 30s | `GET /api/collections/public/:slug` | Public collection page |
| `collection:summary:{id}` | 30s | `GET /api/collections/:id/summary` | Owner's summary stats |
| `dashboard:member:{userId}` | 30s | `GET /api/dashboard/member` | Per-user dashboard |

**Cache invalidation triggers:**

| Event | Invalidate |
|---|---|
| Webhook `payment.completed` fires | `admin:summary`, `admin:activity`, `collection:summary:{projectId}`, `collection:slug:{slug}`, `dashboard:member:{ownerId}` |
| New collection created | `admin:summary`, `admin:activity` |
| Member status changed | `admin:members:list:*` (wildcard delete) |
| Admin settings endpoint hit | `admin:settings` (already TTL, no event needed) |

### 3.3 — What must NOT be cached

| Endpoint | Reason |
|---|---|
| `POST /api/auth/login` | Credential validation must always hit DB |
| `POST /api/auth/register` | Uniqueness check must always hit DB |
| `POST /api/payments/*` | Payment creation is transactional — no caching |
| `POST /api/webhooks/snippe` | Webhook processing must be idempotent but not cached |
| `GET /api/payments/verify/:ref` | Live status check — caching would serve stale payment state |
| `PATCH` / `DELETE` any route | Mutations must never be cached |
| Auth middleware user lookup | Caching `req.user` in Redis would require cache invalidation on user deactivation (complex) — leave for Phase 3b if needed |

### 3.4 — Implementation pattern

```typescript
// lib/cache.ts (new file on server)
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;
  const result = await fn();
  await redis.set(key, result, { ex: ttlSeconds });
  return result;
}

export async function invalidate(key: string) {
  await redis.del(key);
}

export async function invalidatePattern(prefix: string) {
  // Use SCAN for pattern delete — safe for Upstash
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length) await redis.del(...keys);
}
```

**Usage in controller:**
```typescript
// Before:
const data = await getAdminDashboard();

// After:
const data = await withCache("admin:summary", 45, () => getAdminDashboard());
```

**Invalidation in webhook handler (after payment.completed):**
```typescript
await invalidate("admin:summary");
await invalidate("admin:activity");
await invalidate(`collection:slug:${payment.project.slug}`);
await invalidate(`collection:summary:${payment.projectId}`);
```

### 3.5 — Risks

- If Upstash is unreachable, `withCache` must fall through to the real DB call — wrap in try/catch.
- Cache stampede: if TTL expires and 100 concurrent requests hit the same key, all will miss and hit the DB simultaneously. Mitigate with a short random jitter on TTL (±5s) or a soft-lock pattern (low priority).
- Stale data window: 30–60s of stale admin numbers is acceptable for a dashboard preview but not for payment status. This is why payment-sensitive endpoints are excluded.

---

## Phase 4 — Landing Bundle / Animation Optimization

### 4.1 — Recharts lazy-load

As described in Phase 2.3 — `dynamic(() => import("@/components/landing/InsightsSection"))` with `ssr: false`.

This is the highest-value frontend change: removes ~200KB from the initial page bundle.

### 4.2 — Animation audit

| Component | Issue | Fix |
|---|---|---|
| FloatingBlobBackground | Already CSS-only, server component | Done |
| HeroSection | `motion.div` with single animate-in | Fine — framer-motion is lazy-loaded by the time this renders |
| FeaturesSection | `whileInView` on 6 cards | Fine — `once: true`, no infinite loops |
| JourneySection | Phone float `animate={{ y: [0, -10, 0] }}` infinite + shimmer infinite | **These two are the only infinite animations on the page** |
| InsightsSection | All count-up and chart animations are `once: true` | Fine |
| ChipMarquee | `animate={{ x: ["0%", "-50%"] }}` infinite | GPU-composited (transform only) — acceptable |

**Remaining infinite animations (JourneySection):**
- Phone float: can be disabled on mobile with `useReducedMotion()` from framer-motion, or set `animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}`.
- Shimmer sweep: same pattern.
- These run on GPU transform/opacity and don't cause layout recalculation — performance impact is minimal, but disabling under reduced motion is correct accessibility.

### 4.3 — `next/image` audit

Ensure all `<img>` tags that are above the fold use `priority` prop. SVG logos don't need this — they're inline or tiny.

### 4.4 — Font loading

Verify `next/font` is used for any custom fonts. If Google Fonts are loaded via `<link>` in `<head>`, switch to `next/font/google` which self-hosts and eliminates the external DNS lookup.

---

## Phase 5 — API Response Timing

### 5.1 — Cache-Control headers

Add `Cache-Control` on GET responses where safe:

| Endpoint | Header |
|---|---|
| `GET /api/admin/settings` | `Cache-Control: private, max-age=300` |
| `GET /api/admin/system-audit` | `Cache-Control: private, max-age=120` |
| `GET /api/collections/public/:slug` | `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` |

**Do not add** Cache-Control to payment, auth, or mutation endpoints.

### 5.2 — Expensive aggregation timing targets

After Phase 1 indexes and Phase 3 Redis caching, target response times:

| Endpoint | Current (estimated) | Target (cached) | Target (cache miss) |
|---|---|---|---|
| `GET /api/admin/summary` | 400–1200ms | < 10ms | < 200ms |
| `GET /api/admin/activity` | 200–600ms | < 10ms | < 100ms |
| `GET /api/collections/public/:slug` | 50–200ms | < 10ms | < 50ms |
| `GET /api/auth/me` | 20–80ms | unchanged (no cache) | < 30ms after index |
| `GET /api/dashboard/member` | 150–500ms | < 10ms | < 100ms |

### 5.3 — Debounce on admin search

Admin members search and admin payments search fire on every keystroke from the frontend. Add 300ms debounce on search inputs to avoid hitting the regex query on each keypress.

This is a **frontend-only change** — no backend modification needed.

### 5.4 — `$or` query on webhook lookup

`Payment.findOne({ $or: [snippeReference, externalReference, snippeSessionId] })` fires on every webhook. Each branch hits a separate index. This is acceptable for now — three index lookups is fine at low volume. No change needed in Phase 5 unless webhook volume grows significantly.

---

## Deployment / Cost Comparison

| Option | Monthly cost (estimate) | Webhook reliability | Migration risk | Recommendation |
|---|---|---|---|---|
| **Keep DO App Platform + add Upstash Redis** | Current DO cost + ~$0–$5 Redis | Excellent — long-running process, stable | None | **Recommended** |
| Railway | ~$5–$20/mo (Hobby) | Good | Low | Viable alternative if DO costs increase |
| Render | ~$7/mo (Starter) | Good | Low | Viable, slightly slower cold starts |
| Fly.io | ~$3–$10/mo | Excellent — persistent VMs | Medium (Dockerfile needed) | Good long-term, more DevOps overhead |

**Stay on DigitalOcean App Platform.** Reasons:
- Webhook processing requires a stable long-running process — serverless cold starts (Railway free tier, Vercel functions) create a risk of missing webhooks during startup.
- Snippe webhook delivery may retry on timeout — a cold-started backend that takes 2–5s to respond could cause duplicate webhook events.
- Adding Upstash Redis to the current DO setup costs near-zero and eliminates most of the performance issues without any migration risk.

---

## Implementation Phases (after approval)

### Phase 1 — MongoDB indexes *(backend only, zero risk)*

**Files:** `server/src/models/User.model.ts`, `Project.model.ts`, `Payment.model.ts`

Changes: Add 7 compound/single indexes across 3 models. Background index build on Atlas — no downtime.

Estimated time: 30 minutes code, 5–15 minutes index build on Atlas.

---

### Phase 2 — Frontend request / query cleanup *(client only)*

**Files:** `client/app/page.tsx` (or landing layout), `client/components/auth/LoginForm.tsx`, `client/components/auth/RegisterForm.tsx`, any admin search inputs.

Changes:
- Lazy-load `InsightsSection` with `next/dynamic`
- Add `router.prefetch("/dashboard")` before redirect in auth forms
- Add 300ms debounce to admin search inputs

Estimated time: 1–2 hours.

---

### Phase 3 — Upstash Redis cache integration *(backend)*

**New files:** `server/src/lib/cache.ts`

**Modified files:** `server/src/services/dashboard.service.ts`, `server/src/controllers/admin.controller.ts`, `server/src/controllers/collection.controller.ts`, `server/src/services/payment.service.ts` (invalidation after webhook)

Changes:
- Create `withCache` / `invalidate` helpers
- Wrap 6 expensive endpoints with cache
- Add invalidation calls inside `handleSnippeWebhook` and `refreshCollectionStats`
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to DO App Platform env vars

Estimated time: 3–4 hours code + Upstash account setup (free).

---

### Phase 4 — Landing bundle / animation optimization *(client only)*

**Files:** `client/app/page.tsx` or landing layout, `client/components/landing/JourneySection.tsx`

Changes:
- Lazy-load InsightsSection (from Phase 2 — same change)
- Add `useReducedMotion()` check to phone float and shimmer animations in JourneySection
- Verify `next/font` is used for any web fonts

Estimated time: 1 hour.

---

### Phase 5 — API response timing and search debounce *(client + backend)*

**Files:** Admin search input components, admin controllers (Cache-Control headers)

Changes:
- Add debounce to admin search
- Add `res.setHeader("Cache-Control", ...)` on 3 safe GET endpoints
- Verify timing improvements after Phase 1–3

Estimated time: 1–2 hours.

---

## Backlog (low priority, do not implement in current sprint)

- **CSV streaming export** — paginate/stream instead of loading all into memory. Safe to implement but touches the export logic — schedule for after Phase 3.
- **Auth middleware user caching in Redis** — would need invalidation on `user.isActive` change. Moderately complex — schedule after Phase 3 is stable.
- **Recharts reduced-motion for Pie/Area** — already done (`isAnimationActive={!prefersReducedMotion}`).
- **Rate limiter distributed store** — current in-memory store is fine for single-instance DO deployment. If scaled to multiple instances, replace with `rate-limit-redis` backed by Upstash.
- **Webhook queue (Bull/BullMQ)** — async webhook processing. High reliability improvement but requires Redis queue, additional complexity. Post-launch scope.

---

## Summary table

| Phase | Risk | Files changed | Cost impact | Time |
|---|---|---|---|---|
| 1 — MongoDB indexes | Very low | 3 model files | None | 30 min |
| 2 — Frontend cleanup | Low | 3–4 client files | None | 1–2 hrs |
| 3 — Upstash Redis | Low-medium | 5–6 server files + 1 new | ~$0–$5/mo | 3–4 hrs |
| 4 — Landing bundle | Low | 2 client files | None | 1 hr |
| 5 — API response timing | Low | 2–3 files | None | 1–2 hrs |

**Total estimated cost increase:** $0–$5/month (Upstash Redis free tier covers typical SarafuPay usage volume).

**Total estimated implementation time:** 8–12 hours across 5 phases.
