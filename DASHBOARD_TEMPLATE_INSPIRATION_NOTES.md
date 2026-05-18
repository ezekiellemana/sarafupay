# Dashboard Template Inspiration Notes

_Reference: Vercel Next.js + shadcn/ui admin dashboard templates_

---

## Useful design patterns for SarafuPay

### Layout and structure
- Sticky sidebar with icon+label nav items, collapsible on mobile into a slide-over sheet
- Main content uses a single `max-w-7xl` container with consistent `px-4 sm:px-6 lg:px-8` gutters
- Page sections separated by heading rows (`h2` + action link on the right) — not horizontal dividers
- Stats row always comes before tables — metric cards first, then data, then charts

### Card styles
- Cards use `border border-slate-200 bg-white shadow-sm` (light) or `border border-white/10 bg-white/5` (dark)
- Hover state: `hover:shadow-md hover:border-slate-300 transition-shadow` — border darkens, shadow lifts slightly
- No heavy backdrop-blur on every card — reserved for overlays only
- Icon containers: `size-10 rounded-xl` with tinted backgrounds (10–15% opacity)
- Metric label: `text-xs font-semibold uppercase tracking-[0.1em] text-slate-500`
- Metric value: `text-2xl font-bold text-slate-900`

### Table design
- Sticky header on scroll for long tables
- Row hover: `hover:bg-slate-50 transition-colors`
- Status badges: small `rounded-full px-2.5 py-0.5 text-xs font-semibold` chips with tinted bg
- Actions column: icon buttons `size-8 rounded-lg` rather than text "View" buttons
- Compact but readable: `py-3 px-4` per cell, not `py-5`

### Filter / search areas
- Filter bar is a `flex` row (not a grid) — search input takes `flex-1`, filters are fixed-width
- Search input always has a leading icon (Search) and optional trailing clear button
- Status filter uses pill buttons not a `<Select>` — pills read faster and need no click-to-open
- "Clear all" only appears when at least one filter is active
- Filter bar floats above the table/grid with consistent `rounded-2xl border bg-white/80` card wrapper

### Spacing conventions
- Section gap: `gap-6` or `gap-8` between major blocks
- Card internal: `p-6` standard, `p-4` compact
- Label-to-input: `gap-1.5` (not gap-2 — slightly tighter reads cleaner)
- Form field-to-field: `gap-4` (not gap-5)

### Typography
- Page title: `text-2xl font-bold` or `text-3xl font-bold`
- Section heading: `text-lg font-semibold`
- Card titles: `text-sm font-semibold uppercase tracking-wider text-slate-500`
- Body text: `text-sm text-slate-600`
- Helper text: `text-xs text-slate-400`

### Micro-interactions
- Buttons use `transition-colors duration-150` not spring animations
- Cards lift on hover with `transition-shadow` only — no scale transforms on data cards
- Copy buttons animate to a checkmark for 2 seconds
- Loading states use skeleton shimmer, not spinners in content areas

### Mobile behavior
- Tables hide below `md:` and replace with stacked cards
- Cards go single-column below `sm:`
- Sidebar becomes bottom sheet or hamburger menu
- Filter pills wrap to 2 rows — no horizontal scroll

---

## What to avoid

- Floating animated illustration elements (CoinStack, MoneyBag, FloatingCoins) in data cards — they look playful, not professional
- `backdrop-blur-xl` on every single card — slows rendering and adds visual noise
- `shadow-2xl` everywhere — dilutes the hierarchy
- Animated scale transforms on metric cards during hover (subtle `y` lift is fine, scale feels unstable)
- Gradient text on every number — reserve for one or two hero metrics
- Mixing dark glass cards with light glass cards at the same level — pick one per section
- Loop-rendered form fields — explicit fields are easier to style and validate individually

---

## How to adapt to SarafuPay green/gold fintech brand

| Template pattern | SarafuPay adaptation |
|---|---|
| Neutral `slate-200` card borders | `border-white/70 bg-white/85` on light, `border-[#071a0e] bg-[#071a0e]` on dark |
| Generic blue accent | `#16a34a` (emerald) for primary, `#f59e0b` (amber) for secondary/gold |
| Neutral icon tints | Green tint (`emerald-500/12`) for primary, amber tint for wallet/money icons |
| Generic "Dashboard" heading | Personalized "Welcome back, {name}" with sub-description |
| Neutral empty states | Dashed green border, green icon container — fintech feel, not generic |
| Plain progress bar | Amber gold variant for contribution tracking |
| Standard table chips | `StatusBadge` using green/amber/red color coding |

---

## Recommended next polish phases

### Phase 4 (current) — Member Dashboard Polish
Targets: WalletSummary cleanup, ContributionProgress illustration replacement,  
CollectionForm labels/inputs, Profile labels/inputs, Payments filter bar.

### Phase 5 — Admin Dashboard Polish
Targets: admin overview stats cards, admin sidebar polish, admin table filter bars,  
MemberDetailDrawer, admin activity/audit pages.

### Phase 6 — Public Payment Page Polish
Targets: `/pay/[slug]` page (contributor-facing), `/payment/return` page,  
OrganizerProfile section, contributor table on public page.

### Phase 7 — Micro-interactions + Motion Audit
Targets: reduce spring animations on data cards, audit all `motion.div` usage,  
ensure consistent `transition-shadow` hover on all cards, remove scale transforms  
from stat cards, keep motion on CTA buttons and page transitions only.

### Phase 8 — Mobile 375px Audit
Targets: test every page at 375px width, fix any text overflow, cramped padding,  
or missing mobile card variants.
