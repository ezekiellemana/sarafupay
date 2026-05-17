# SarafuPay — Super Admin Feature Plan

**Role model:** `admin` = platform owner / super admin (MVP). No new roles added.
**Constraint:** No changes to payment logic, webhook logic, or Snippe integration.

---

## Current Admin Capabilities

### Backend endpoints (all protected by `protect` + `requireAdmin`)

| Method | Route | Handler | What it returns |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard/admin` | `getAdminDashboard()` | totalCollected, totalMembers, paidThisMonth, pendingPayments, failedPayments, monthlyChart (12 mo), latestPayments (8), projects (all) |
| `GET` | `/api/admin/summary` | `summary()` → same service | Same as above (redundant, kept for backwards compat) |
| `GET` | `/api/admin/members` | `members()` | All users with role=member, enriched with totalPaid + paidMonths |
| `GET` | `/api/admin/payments` | `payments()` | Paginated payments, filterable by status / month / projectId / search |
| `GET` | `/api/admin/unpaid-members` | `unpaidMembers()` | Members with no completed payment this month |
| `GET` | `/api/admin/export/payments` | `exportPaymentsCsv()` | CSV file download |
| `GET` | `/health` | inline in app.ts | status, db, uptime, environment — **no auth required** |

### Frontend admin pages

| Page | What it shows today |
| --- | --- |
| `/admin` | 4 KPI cards (totalCollected, totalMembers, paidThisMonth, failedPayments), 12-month area chart, latest 8 payments |
| `/admin/members` | Search input + table: name, email, phone, totalPaid |
| `/admin/payments` | Search + paginated table + CSV export button |
| `/admin/projects` | Create project form + grid of all projects |

### Key files

**Backend**
- `server/src/services/dashboard.service.ts` — `getAdminDashboard()` (extend here for Phase A)
- `server/src/controllers/admin.controller.ts` — all admin controllers
- `server/src/routes/admin.routes.ts` — route registration
- `server/src/models/User.model.ts` — `isActive` boolean gates auth
- `server/src/middleware/auth.middleware.ts` — `protect` (checks `isActive` on every request)
- `server/src/middleware/admin.middleware.ts` — `requireAdmin`

**Frontend**
- `client/app/admin/page.tsx` — main dashboard
- `client/app/admin/members/page.tsx`
- `client/app/admin/payments/page.tsx`
- `client/app/admin/projects/page.tsx`
- `client/components/admin/AdminStatsCards.tsx` — 4-card KPI grid
- `client/components/admin/MembersTable.tsx`
- `client/components/admin/AdminPaymentsTable.tsx`
- `client/components/admin/ProjectForm.tsx`
- `client/hooks/useDashboard.ts` — `useAdminDashboard()` calls `GET /api/dashboard/admin`
- `client/types/index.ts` — `AdminDashboardData` type

---

## What Is Missing

- No user activate/deactivate endpoint or UI
- No filter by role/status on members page
- No total user / total project / total payment KPIs on overview
- No recent registrations or recent projects on overview
- No quick-links section (Manage Members / Projects / Payments / Health)
- No project status override (pause / close) by admin
- Admin projects page shows only admin-created projects, not member-created ones
- No owner info displayed on projects
- No date range or amount range filters on payments
- No payment detail drawer
- No system health panel in the UI
- No pre-launch audit checklist

---

## Phase Plans

---

### Phase A — Platform Overview Improvements

**Goal:** Replace the 4-card KPI strip with a full platform health overview.

**Risk: Low — read-only only, no mutations.**

#### Backend — `server/src/services/dashboard.service.ts`

Add to the `Promise.all([...])` in `getAdminDashboard()`:

```
totalUsers         = User.countDocuments()
activeUsers        = User.countDocuments({ isActive: true })
totalCollections   = Project.countDocuments()
activeCollections  = Project.countDocuments({ status: "active" })
totalPayments      = Payment.countDocuments()
completedPayments  = statusMap.get("completed")   // already computed from statusCounts
recentUsers        = User.find().sort({ createdAt: -1 }).limit(5).select("fullName email phoneNumber createdAt role isActive")
recentProjects     = Project.find().sort({ createdAt: -1 }).limit(5).lean()
```

Extend the return object and the `AdminDashboardData` type in `client/types/index.ts`.

**Files changed:**
- `server/src/services/dashboard.service.ts` — add 4 new parallel queries, extend return
- `client/types/index.ts` — extend `AdminDashboardData`
- `client/components/admin/AdminStatsCards.tsx` — 8-card grid (2 rows of 4)
- `client/app/admin/page.tsx` — add Recent Users, Recent Projects sections, Quick Links

**No new routes. No mutations. No risk to existing flows.**

---

### Phase E — System Health Panel

**Goal:** Show live backend/DB status from the admin dashboard.

**Risk: Low — frontend-only, uses existing public `/health` endpoint.**

#### Backend

Zero changes. `GET /health` already returns:
```json
{ "status": "ok", "uptime": 140, "environment": "production", "db": "connected", "timestamp": "..." }
```

#### Frontend — new `SystemHealthCard` component

- `client/components/admin/SystemHealthCard.tsx` — fetches `GET /health`, shows status badge, db, environment, uptime, last checked time + Refresh button
- `client/app/admin/page.tsx` — render it in the overview page

**Files changed:** 1 new component + 1 page edit.

---

### Phase F — Pre-Launch Audit Checklist

**Goal:** Admin sees at a glance if all critical configuration is in place.

**Risk: Low — boolean flags only, no secret values exposed.**

#### Backend — new controller + route

```
GET /api/admin/audit
Returns boolean flags only — never exposes values:
{
  dbConnected: boolean,
  snippeApiKeyConfigured: boolean,
  snippeWebhookSecretConfigured: boolean,
  snippeProfileIdConfigured: boolean,
  clientUrlConfigured: boolean,
  serverUrlConfigured: boolean,
  jwtSecretConfigured: boolean,
  nodeEnvProduction: boolean
}
```

**Files changed:**
- `server/src/controllers/admin.controller.ts` — new `audit` handler
- `server/src/routes/admin.routes.ts` — `router.get("/audit", audit)`
- `client/components/admin/AuditChecklist.tsx` — new component, green check / red X per flag

---

### Phase D — Payment Monitoring Enhancements

**Goal:** Add date range and amount range filters; add payment detail drawer.

**Risk: Low — read-only query enhancements, no mutations.**

#### Backend — `server/src/controllers/admin.controller.ts` → `payments()`

Add to query builder (no new route):
```
dateFrom / dateTo  → filter createdAt: { $gte, $lte }
amountMin / amountMax → filter amount: { $gte, $lte }
```

Also populate `ownerId` (project owner) in payment rows for display.

#### Frontend — `client/app/admin/payments/page.tsx`

- Date range picker (two `<input type="date">`)
- Amount range inputs
- New `PaymentDetailDrawer` component: click a row → side drawer showing full record (reference, customerName/phone, monthPaidFor, paidAt, metadata summary)

**Files changed:**
- `server/src/controllers/admin.controller.ts` (payments fn — ~10 lines)
- `client/app/admin/payments/page.tsx`
- `client/components/admin/PaymentDetailDrawer.tsx` (new)

---

### Phase B — Member Management

**Goal:** Admin can activate/deactivate users safely. Deactivated users cannot log in.

**Risk: Medium — writes to User.isActive. Reversible. Protected by guards.**

#### Backend — new route

```
PATCH /api/admin/members/:id/status
Body: { isActive: boolean }
Guards (enforced in controller):
  - cannot modify yourself (req.user._id !== id)
  - cannot deactivate another admin (target.role !== "admin")
Returns: updated user without passwordHash
```

**Why deactivation works immediately:** `protect` middleware re-fetches the user from DB on every request and checks `user.isActive`. No token invalidation needed.

**Files changed:**
- `server/src/controllers/admin.controller.ts` — new `updateMemberStatus` handler
- `server/src/routes/admin.routes.ts` — `router.patch("/members/:id/status", updateMemberStatus)`

#### Frontend

- `client/app/admin/members/page.tsx` — add status filter chips (All / Active / Inactive), pass to API
- `client/components/admin/MembersTable.tsx` — add Activate/Deactivate button per row, show isActive badge
- New `ConfirmDialog` component — "Deactivate {name}? They will not be able to log in." — with Cancel + Confirm buttons

**Files changed:**
- `client/app/admin/members/page.tsx`
- `client/components/admin/MembersTable.tsx`
- `client/components/ui/ConfirmDialog.tsx` (new, reusable)

---

### Phase C — Collection / Project Management

**Goal:** Admin sees ALL collections (including member-created) with owner info and can change their status.

**Risk: Medium — status mutation affects payment acceptance. Close is reversible. Protected by confirmation.**

#### Backend — two new routes

```
GET /api/admin/collections
Query: search, status, page, limit
Populates: ownerId → { fullName, email }
Returns: all projects with owner info, totalCollected, contributorCount
```

```
PATCH /api/admin/collections/:id/status
Body: { status: "active" | "paused" | "closed" }
Guard: only these 3 statuses allowed (no "draft" or "completed" via this route)
Returns: updated project
```

**Why a new route, not reuse `/api/projects`?** Existing `/api/projects` is member-facing, returns only the authenticated user's own projects, and has different filters.

**Files changed:**
- `server/src/controllers/admin.controller.ts` — new `collections` + `updateCollectionStatus` handlers
- `server/src/routes/admin.routes.ts` — 2 new route registrations

#### Frontend — `/admin/projects` page

Replace the current form-only page with a split layout:
- **Top half:** searchable filterable table of ALL collections (title, owner, status badge, totalCollected, contributorCount) with Pause / Reactivate / Close actions. Close shows `ConfirmDialog`.
- **Bottom / collapsible:** "Create Platform Project" form (existing `ProjectForm`, unchanged)

**Files changed:**
- `client/app/admin/projects/page.tsx`
- `client/components/admin/AdminCollectionsTable.tsx` (new)

---

## Summary Table

| Phase | Backend changes | Frontend changes | Risk | Value |
| --- | --- | --- | --- | --- |
| **A — Overview KPIs** | Extend `getAdminDashboard()` service only | 8-card grid, recent users/projects, quick links | Low | High |
| **E — Health panel** | None | 1 new `SystemHealthCard` component | Low | Medium |
| **F — Audit checklist** | 1 new `audit` handler + route | 1 new `AuditChecklist` component | Low | Medium |
| **D — Payment filters** | Extend `payments()` query (~10 lines) | Date/amount filters + detail drawer | Low | Medium |
| **B — Member deactivate** | 1 new `PATCH` endpoint with guards | Confirmation dialog, status filter, row actions | Medium | High |
| **C — Collection admin** | 2 new routes (GET + PATCH) | New collections table, status actions | Medium | High |

---

## Recommended Implementation Order

**Round 1 — Phase A + E (implement together)**
Read-only. Zero risk to existing flows. Highest immediate value. Makes the overview page a real platform dashboard.

**Round 2 — Phase F**
Backend is a single function returning booleans. Frontend is a simple card. Low risk.

**Round 3 — Phase D**
Payment filter enhancements are mostly additive query params + a drawer component. Very safe.

**Round 4 — Phase B**
Member deactivation. Needs careful guard implementation and confirmation UI. Validate + test before proceeding to C.

**Round 5 — Phase C**
Collection management. New backend routes + replacement of the projects page. Most frontend work.

---

## What Will NOT Be Changed (Hard Constraints)

- `POST /api/payments/create-session` — untouched
- `POST /api/payments/create-public-session` — untouched
- `POST /api/webhooks/snippe` — untouched
- `server/src/services/snippe.service.ts` — untouched
- `server/src/utils/webhookVerifier.ts` — untouched
- No new roles added (`member` and `admin` remain the only roles)
- No payment records deleted or manually completed
- No user records deleted
- Member dashboard (`/dashboard`) untouched
- Project creation/payment/CSV/receipt flows untouched
