# SarafuPay — Analytics & Traffic Tracking Plan

---

## Recommended Tool: Plausible Analytics

### Why Plausible

| Requirement | Plausible | PostHog | Umami (self-hosted) | Custom MongoDB |
|---|---|---|---|---|
| Low cost | ✅ $9/mo (10K views) | ✅ Free up to 1M events | ✅ Free (server cost) | ✅ Free |
| Next.js integration | ✅ `next-plausible` package | ✅ | Manual | Manual |
| Privacy-first (no cookies) | ✅ | ⚠️ Cookies by default | ✅ | ✅ |
| Real-time dashboard | ✅ | ✅ | ✅ | ❌ (build it yourself) |
| Custom event tracking | ✅ | ✅ | ✅ | ✅ |
| Traffic source / UTM | ✅ | ✅ | ✅ | ❌ (build it yourself) |
| Funnel/goal tracking | ✅ | ✅ | ⚠️ Limited | ❌ |
| Country/device breakdown | ✅ | ✅ | ✅ | ❌ |
| Embed stats in admin | ✅ Plausible Embed API | ⚠️ Possible | ⚠️ Possible | ✅ |
| Backend complexity | None | Low | Medium (host DB) | High |
| GDPR/privacy compliant | ✅ No consent banner needed | ⚠️ Needs config | ✅ | ✅ |

**Decision: Plausible Analytics**

Reasons:
- Cookieless — no consent banner required in Tanzania or EU context
- `next-plausible` package makes Next.js integration a 10-minute task
- Plausible's Embed API allows embedding live stats directly in `/admin/analytics`
- $9/month is acceptable for an MVP; scales based on pageviews, not events
- No backend required — zero infrastructure overhead
- Real-time dashboard out of the box

---

## Cost Expectation

| Tier | Price | Pageviews/month |
|---|---|---|
| Starter | $9/mo | up to 10,000 |
| Growth | $19/mo | up to 100,000 |
| Business | $49/mo | up to 1,000,000 |

For MVP: $9/month is very low risk.

---

## What to Track

### Page Views (automatic with Plausible)
- All page routes — tracked automatically
- Traffic sources (referrer, UTM params)
- Device type (mobile/tablet/desktop)
- Browser
- Country (from IP geolocation — no GPS, no PII)
- Entry page / exit page

### Custom Events (manually instrumented)

#### Landing & Auth funnel
| Event name | Where | Trigger |
|---|---|---|
| `hero_cta_clicked` | `/` HeroSection | Click "Get Started" or "Pay Now" |
| `register_clicked` | `/` Navbar | Click "Get Started" button |
| `login_clicked` | `/login` | Page loaded |
| `google_login_clicked` | `/login` or `/register` | Click Google auth button |
| `account_registered` | After successful register | Registration success |
| `account_logged_in` | After successful login | Login success |

#### Dashboard funnel
| Event name | Where | Trigger |
|---|---|---|
| `dashboard_viewed` | `/dashboard` | Page loaded |
| `admin_dashboard_viewed` | `/admin` | Page loaded |

#### Collection funnel
| Event name | Where | Trigger |
|---|---|---|
| `collection_create_clicked` | `/dashboard` | Click "Create Project" |
| `collection_created` | Collection form submit | Successful save |
| `collection_link_copied` | Collection detail page | Click "Copy link" |
| `whatsapp_share_clicked` | Collection detail page | Click WhatsApp share |
| `qr_downloaded` | Collection detail page | Click QR download |

#### Payment funnel
| Event name | Where | Trigger |
|---|---|---|
| `public_payment_page_viewed` | `/pay/[slug]` | Page loaded |
| `payment_started` | `/pay/[slug]` | Click pay / submit amount |
| `payment_return_viewed` | `/payment/return` | Page loaded |
| `payment_completed` | `/payment/return` | Status is "completed" |
| `receipt_print_clicked` | Receipt dialog | Click print |

---

## What NOT to Track

- Passwords, tokens, JWT values
- Snippe API keys or webhook secrets
- Full payment credentials (card numbers, MPesa secrets)
- Private user PII beyond userId (no emails, phone numbers, names in event metadata)
- Typed form values (no input recording, no session replay enabled)
- Sensitive query params (payment references in URLs should be excluded)
- Session tokens or cookie values
- Private collection details (amounts, member lists) for non-admin views

---

## Privacy Implications

- Plausible does not use cookies → no consent banner required
- Plausible hashes IP+UA daily to count unique visitors — no raw IP stored
- Country detection is server-side from anonymized IP — complies with GDPR
- Custom events must NOT include PII in event properties
- For logged-in users: do NOT pass userId to Plausible (they are anonymous in analytics)
- All tracking is aggregate — no individual user session profiles

### Privacy Policy Update Required
When analytics is live, add a section to `/privacy` covering:
- "We use Plausible Analytics, a cookieless, privacy-preserving analytics tool"
- "We collect anonymous usage data: page views, traffic sources, button clicks"
- "No personal data is stored in analytics. No cookies are used."
- "You can review Plausible's data policy at plausible.io/data-policy"

---

## Frontend Files to Instrument

| File | Events |
|---|---|
| `client/app/layout.tsx` (or `_app`) | Add `PlausibleProvider` wrapper |
| `client/components/landing/HeroSection.tsx` | `hero_cta_clicked` |
| `client/components/layout/Navbar.tsx` | `register_clicked` |
| `client/app/login/page.tsx` | `login_clicked` |
| `client/app/register/page.tsx` | `account_registered` |
| `client/components/auth/GoogleAuthButton.tsx` | `google_login_clicked` |
| `client/app/dashboard/page.tsx` | `dashboard_viewed` |
| `client/app/admin/page.tsx` | `admin_dashboard_viewed` |
| `client/app/dashboard/collections/new/page.tsx` | `collection_create_clicked` |
| `client/components/collections/PaymentLinkCard.tsx` | `collection_link_copied`, `whatsapp_share_clicked`, `qr_downloaded` |
| `client/app/pay/[slug]/page.tsx` | `public_payment_page_viewed`, `payment_started` |
| `client/app/payment/return/page.tsx` | `payment_return_viewed`, `payment_completed` |
| `client/components/payments/PaymentReceiptDialog.tsx` | `receipt_print_clicked` |

---

## Backend Events to Instrument

Plausible is frontend-only. No backend instrumentation needed.

If we later add server-side event tracking (e.g., webhook-confirmed payments), we can use Plausible's **server-side Events API**:
```
POST https://plausible.io/api/event
```
This would be for:
- `payment_completed` — confirmed by webhook (more reliable than client-side)
- `account_registered` — server confirms user creation

These are Phase 4+ additions.

---

## Admin Dashboard Design Plan — `/admin/analytics`

### Layout
```
/admin/analytics
├── Header: "Analytics" | "Powered by Plausible" | date range selector
├── Row 1: KPI chips — Total Visitors | Unique Visitors | Pageviews | Bounce Rate
├── Row 2 (2-col):
│   ├── Left: Visitors over time — area chart (green gradient, same as revenue chart style)
│   └── Right: Top Sources — ranked horizontal bars (gold #1, emerald #2–3, slate rest)
├── Row 3 (2-col):
│   ├── Left: Top Pages — ranked list with visit count
│   └── Right: Device Breakdown — simple bar or pill breakdown (mobile/desktop/tablet)
├── Row 4: Payment Funnel — step cards
│   Landing → Register → Login → Create Collection → Share Link → Payment Started → Completed
├── Row 5: Recent Live Events — animated feed (last 10 custom events)
└── Footer: "Data via Plausible Analytics · cookieless · privacy-first"
```

### Embedding Plausible Stats
Plausible provides an Embed API:
```tsx
<iframe
  plausible-embed
  src="https://plausible.io/share/sarafupay.com?auth=TOKEN&embed=true&theme=light"
  scrolling="no"
  frameborder="0"
  loading="lazy"
  style={{ width: '1px', minWidth: '100%', height: '1600px' }}
/>
```
This embeds the full Plausible dashboard. Use it for the initial admin analytics page until the custom-built version is ready.

---

## Database / Schema Plan

**Not needed.** Plausible handles all storage. No MongoDB schema changes required for analytics.

If we ever switch to a custom tracking solution (Phase 6+), we would add:
```typescript
// AnalyticsEvent model (hypothetical, not in scope now)
{
  event: string,           // event name
  path: string,            // page path
  referrer?: string,       // traffic source
  utm_source?: string,
  device?: string,         // mobile/desktop
  country?: string,
  sessionId: string,       // anonymous (hashed)
  userId?: ObjectId,       // only if logged-in and safe
  createdAt: Date
}
```

---

## Phased Implementation Plan

### Phase 1 — Text contrast/readability polish ✅ COMPLETE
- Fix `text-slate-400` → `text-slate-500/600` across mobile cards
- Fix `text-[10px]` → `text-[11px]` for type labels
- Improve `font-medium`/`font-semibold` on field labels
- DashboardCard title: `text-slate-500` → `text-slate-600`
- MobileNav More sheet: inactive icon `text-slate-400` → `text-slate-500`

### Phase 2 — Analytics tool setup
- Sign up for Plausible Analytics at plausible.io
- Add site domain (e.g. `sarafupay.com`)
- Get embed share token for `/admin/analytics`
- Install `next-plausible` package: `npm install next-plausible`
- Add `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=sarafupay.com` to `.env.local`
- Wrap `client/app/layout.tsx` with `<PlausibleProvider domain={...}>`

### Phase 3 — Basic pageview + traffic source tracking
- Plausible auto-tracks all pageviews on install
- Add UTM param support (automatic in Plausible)
- Verify referrers show TikTok / Instagram / WhatsApp / Google
- Test with UTM links: `?utm_source=instagram&utm_medium=social&utm_campaign=launch`

### Phase 4 — Product event tracking
- Instrument each frontend file listed above
- Use `usePlausible()` hook from `next-plausible`
- Test funnel: landing → register → dashboard → collection → payment
- Verify events appear in Plausible dashboard

### Phase 5 — /admin/analytics dashboard
- Create `client/app/admin/analytics/page.tsx`
- Embed Plausible shared dashboard via iframe (fast, zero backend work)
- Build custom funnel visualization using tracked event counts
- Add to admin sidebar nav and mobile More menu

### Phase 6 — Privacy policy update
- Update `client/app/privacy/page.tsx` with Plausible disclosure section
- Keep it short: cookieless, anonymous, no PII, aggregate only

---

## Traffic Sources to Verify

| Source | How it appears in Plausible |
|---|---|
| TikTok | `tiktok.com` referrer or `utm_source=tiktok` |
| Instagram | `l.instagram.com` referrer or `utm_source=instagram` |
| WhatsApp | `utm_source=whatsapp` (WhatsApp strips referrers by default) |
| Facebook | `l.facebook.com` or `utm_source=facebook` |
| Google organic | `google.com` referrer |
| Direct | No referrer |
| SarafuPay referral | Internal links across the app |

---

*Written: 2026-05-19 | Status: Phase 1 complete, Phases 2–6 pending approval*
