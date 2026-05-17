# SarafuPay — Super Admin Feature Plan

**Role model:** `admin` = platform owner / super admin (MVP). No new roles added.
**Constraint:** No changes to payment logic, webhook logic, or Snippe integration.

---

## Current Admin Capabilities (as of v1.2.1)

### Backend routes — all under `/api/admin/*`, all require `role: admin`

| Method | Route | What it does |
| --- | --- | --- |
| `GET` | `/api/admin/summary` | Aggregated dashboard: totalCollected, totalMembers, paidThisMonth, pendingPayments, failedPayments, monthlyChart (12 months), latestPayments (8), projects |
| `GET` | `/api/admin/members` | All members (role=member), searchable by name/email/phone, enriched with totalPaid |
| `GET` | `/api/admin/payments` | All payments, paginated, filtered by status/month/projectId/search |
| `GET` | `/api/admin/unpaid-members` | Members with no completed payment this month |
| `GET` | `/api/admin/export/payments` | Full CSV export of all payments |

### Frontend pages

| Page | What it shows |
| --- | --- |
| `/admin` | 4 KPI cards (totalCollected, members, paid this month, failed), monthly area chart, latest 8 payments table |
| `/admin/members` | Search input + members table (name, email, phone, totalPaid) |
| `/admin/payments` | Search + paginated payments table + CSV export button |
| `/admin/projects` | Project creation form + grid of all admin-created projects |

### What is NOT covered today

- No user activate/deactivate
- No member-created collection (public collections) visible in admin
- No admin project status override (pause/close)
- No date/amount range filters on payments
- No system health panel in the UI
- No audit/pre-launch checklist UI
- No recent registrations or recent projects on the overview page
- No total user count, total project count, total payment count KPIs
- No payment detail drawer

---

## Missing Features by Phase

---

### Phase A — Platform Overview Improvements

**Goal:** Make the `/admin` dashboard show full platform health at a glance.

#### Backend — extend `GET /api/admin/summary`

Add to the existing `getAdminDashboard` aggregation (all read-only):

| New field | Source |
| --- | --- |
| `totalUsers` | `User.countDocuments()` |
| `activeUsers` | `User.countDocuments({ isActive: true })` |
| `totalCollections` | `Project.countDocuments()` |
| `activeCollections` | `Project.countDocuments({ status: "active" })` |
| `totalPayments` | `Payment.countDocuments()` |
| `completedPayments` | already have via aggregation |
| `recentUsers` | `User.find().sort({ createdAt: -1 }).limit(5).select(...)` |
| `recentProjects` | `Project.find().sort({ createdAt: -1 }).limit(5).lean()` |

**Files changed:** `server/src/services/dashboard.service.ts` only.
**Risk:** Low — read-only aggregations, no mutations.

#### Frontend — `/admin` page

- Replace 4-card grid with 8-card grid (2 rows of 4)
- Add "Recent Registrations" section (last 5 users)
- Add "Recent Projects" section (last 5 collections)
- Add quick-link cards at the bottom: Manage Members / Manage Projects / Manage Payments / System Health

**Files changed:** `client/app/admin/page.tsx`, `client/components/admin/AdminStatsCards.tsx`
**Risk:** Low.

---

### Phase B — Member Management

**Goal:** Let admin activate/deactivate users safely.

#### Backend — new route

```
PATCH /api/admin/members/:id/status
Body: { isActive: boolean }
Guard: cannot deactivate yourself (req.user._id !== id)
Guard: cannot deactivate another admin
Returns: updated user (no passwordHash)
```

**Files changed:** `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.routes.ts`
**Risk:** Medium — mutations. Deactivating a user blocks their next login (isActive check in auth). Reversible.

#### Frontend — `/admin/members` page

- Add role/status filter chips (All / Active / Inactive)
- Add "Deactivate" / "Reactivate" button per row
- Confirmation dialog before deactivate: "Deactivate {name}? They will not be able to log in."
- Show member's collection count and total they've collected in project(s)

**Files changed:** `client/app/admin/members/page.tsx`, `client/components/admin/MembersTable.tsx`
**Risk:** Medium — needs confirmation guard.

---

### Phase C — Project / Collection Management

**Goal:** Admin can see ALL collections (including member-created) and control their status.

#### Backend — new route

```
GET /api/admin/collections
Query: search, status, page, limit
Populates: ownerId → { fullName, email }
Returns: all projects/collections with owner info, totalCollected, contributorCount
```

```
PATCH /api/admin/collections/:id/status
Body: { status: "active" | "paused" | "closed" }
Guard: cannot delete, only status change
```

**Why new route, not reuse `/api/projects`?** The existing `/api/projects` is member-facing and returns only the user's own projects. Admin needs all projects with owner info.

**Files changed:** `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.routes.ts`
**Risk:** Medium — status change (pause/close) affects payment acceptance for that collection. Closing is reversible by reopening. Add confirmation for "close".

#### Frontend — `/admin/projects` page

- Replace current form-heavy page with a split layout:
  - Top: searchable, filterable table of ALL collections with owner, status, totalCollected
  - Bottom (or modal): "Create platform project" form (existing ProjectForm)
- Actions per row: Pause / Reactivate / Close (with confirmation on Close)

**Files changed:** `client/app/admin/projects/page.tsx`, new `AdminCollectionsTable` component
**Risk:** Medium.

---

### Phase D — Payment Monitoring Enhancements

**Goal:** Add date range and amount range filters; add payment detail drawer.

#### Backend — extend `GET /api/admin/payments`

Add query params:
- `dateFrom` / `dateTo` → filter `createdAt` range
- `amountMin` / `amountMax` → filter `amount` range
- No new route needed — extend existing query builder

Also populate `ownerId` (project owner) in payment rows.

**Files changed:** `server/src/controllers/admin.controller.ts`
**Risk:** Low — read-only query enhancements.

#### Frontend — `/admin/payments` page

- Date range picker (two date inputs)
- Amount range inputs
- Payment detail drawer: click a row to see full payment record (reference, metadata, webhookPayload summary, paidAt)

**Files changed:** `client/app/admin/payments/page.tsx`, new `PaymentDetailDrawer` component
**Risk:** Low.

---

### Phase E — System Health Panel

**Goal:** Admin can see live backend/DB status from the dashboard.

#### Backend
No changes. Uses existing `GET /health` endpoint (public, no auth required):
```json
{ "status": "ok", "uptime": 140, "environment": "production", "db": "connected", "timestamp": "..." }
```

#### Frontend — new `SystemHealthCard` component

- Fetches `GET /health` on mount and on "Refresh" button click
- Shows: status, db, environment, uptime, last checked time
- Green badge if `status: ok`, red badge if `status: degraded` or fetch error
- No secrets exposed (health endpoint already sanitized)

**Files changed:** `client/components/admin/SystemHealthCard.tsx` (new), `client/app/admin/page.tsx`
**Risk:** Low.

---

### Phase F — Audit / Pre-Launch Checklist

**Goal:** Admin sees at a glance whether all critical platform settings are configured.

#### Backend — new route

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
  nodeEnvProduction: boolean
}
```

**Files changed:** `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.routes.ts`
**Risk:** Low — boolean flags, no secret values.

#### Frontend — `AuditChecklist` component

- Shows each flag as a green checkmark or red X
- Links to relevant settings page or DEPLOYMENT.md
- "All checks passing" / "N checks need attention" summary

**Files changed:** `client/components/admin/AuditChecklist.tsx` (new), `client/app/admin/page.tsx`
**Risk:** Low.

---

## Summary Table

| Phase | Backend changes | Frontend changes | Risk | Value |
| --- | --- | --- | --- | --- |
| **A — Overview KPIs** | Extend `/summary` aggregation | 8-card grid, recent users/projects sections | Low | High |
| **E — Health panel** | None (uses `/health`) | New `SystemHealthCard` component | Low | Medium |
| **D — Payment filters** | Extend query params | Date/amount filters, detail drawer | Low | Medium |
| **B — Member deactivate** | New `PATCH /admin/members/:id/status` | Confirmation dialog, status filter | Medium | High |
| **C — Collection admin** | New `GET/PATCH /admin/collections` | New collections table, status actions | Medium | High |
| **F — Audit checklist** | New `GET /admin/audit` | New `AuditChecklist` component | Low | Medium |

---

## Recommended Implementation Order

**Phase A + E together** — read-only, zero risk to existing flows, highest immediate value.
Gives the platform overview page real substance and a live health indicator.

**Phase D** — payment filter improvements are frontend-mostly, very safe.

**Phase B** — member deactivation after A/E/D are stable and tested.

**Phase C** — project admin management (new backend route required).

**Phase F** — audit checklist last, as it depends on all other phases being stable.

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
