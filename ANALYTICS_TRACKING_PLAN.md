# SarafuPay — Analytics & Traffic Tracking Plan (Revised)

Phase 1 complete. This document covers the tool decision, privacy safeguards, and phased implementation plan for Phases 2–7.

---

## Option A vs Option B — Head-to-Head

### Option A — Plausible Analytics

**What it is:** Privacy-first, cookieless, aggregate-only website analytics.

**Strengths:**

- No cookies — no consent banner required
- Truly anonymous — no individual session tracking, no person profiles
- Embed API lets you put a live chart in `/admin/analytics` with one iframe
- $9/month for 10K pageviews — very low cost

**Critical gaps for SarafuPay's requirements:**

- ❌ No individual session tracking — cannot see what a specific user is currently doing
- ❌ No live active sessions count
- ❌ No user path analysis (what pages did this session visit in order)
- ❌ No funnel drop-off detail — only goal counts, not step-by-step conversion with percentages
- ❌ No cohort analysis (e.g. "users who registered this week and paid within 3 days")
- ❌ No session replay — cannot watch how a confused user navigated
- ❌ No product event properties — cannot attach `{ collection_type: "wedding" }` to events and filter by it
- ❌ Traffic source → action correlation is weak (you can see visitors from TikTok, but not whether they registered)

**Verdict:** Plausible is excellent for traffic analytics. It is not a product analytics tool. It cannot answer "how many users from Instagram actually completed a payment?" without heavy manual work.

---

### Option B — PostHog

**What it is:** Full product analytics suite — event tracking, funnels, user paths, session replay, cohorts, feature flags.

**Strengths relevant to SarafuPay:**

- ✅ Free tier: **1 million events/month** — enough for SarafuPay MVP for many months
- ✅ Free tier: **5,000 session recordings/month** — sufficient for UX review
- ✅ Real-time live events feed — see events as they happen
- ✅ Live sessions count — see "8 users on site right now"
- ✅ Full funnel visualization: Landing → Register → Dashboard → Collection → Payment, with drop-off %
- ✅ User paths: exactly what pages/actions preceded or followed any event
- ✅ Traffic source → action correlation: "TikTok visitors converted to registration at 12%"
- ✅ Social media source performance with event depth (not just referrer counts)
- ✅ Custom event properties: `{ collection_type, source, device }` — filterable
- ✅ Session replay with **input masking** and **URL blocking**
- ✅ PostHog identifies users by a safe internal ID — no email/phone/name required
- ✅ GDPR-compliant with proper configuration
- ✅ `posthog-js` has a React/Next.js provider
- ✅ PostHog Shared Dashboard embed — embeds live charts in our admin panel

**Cost reality:**

| Usage | Price |
| --- | --- |
| Up to 1M events/month | **$0 (free forever)** |
| 1M–2M events/month | ~$0.00031/event over 1M (~$310 for the extra million) |
| Up to 5,000 session recordings/month | **$0** |
| Beyond 5,000 recordings | $0.005 per recording |

For SarafuPay MVP (< 5,000 active users), estimated events: ~200K–500K/month. **Cost: $0/month for a very long time.**

**Gaps:**

- Uses first-party cookies by default (can be configured cookieless, but consent may be needed in EU context)
- Requires more careful privacy configuration than Plausible
- More setup complexity (worth it for the capability gap)

---

## Final Recommendation: PostHog

**Use PostHog.** The product analytics capabilities Plausible lacks are exactly what SarafuPay needs at this stage: funnel conversion, live sessions, user paths, traffic source → action correlation, and session replay for UX debugging. The free tier is extremely generous — SarafuPay will not pay for analytics for a long time.

The privacy risks are real but fully manageable with the safeguards described below.

---

## Privacy Rules & Safeguards

### Hard Rules — Never Violate

- Never send passwords, tokens, JWT values, or Snippe secrets in any event property
- Never send email, phone number, or full name in event properties
- Never record form input values — mask ALL inputs in session replay
- Never capture the contents of payment amount inputs, reference fields, or credential fields
- Never send `externalReference`, `snippeReference`, or webhook payloads to PostHog
- Never identify users by email — only by an internal MongoDB `userId` string

### PostHog Configuration Safeguards

#### 1. Disable Autocapture — Use Manual Events Only

```javascript
posthog.init(POSTHOG_KEY, {
  autocapture: false,  // critical — prevents accidental capture of form data
  capture_pageview: false,  // manage pageviews manually per route
})
```

Autocapture clicks on everything by default. Disabling it means only explicitly coded `posthog.capture(...)` calls fire. This is the single most important safety setting.

#### 2. Mask All Inputs in Session Replay

```javascript
posthog.init(POSTHOG_KEY, {
  session_recording: {
    maskAllInputs: true,           // masks every <input>, <textarea>, <select>
    maskInputOptions: {
      password: true,              // redundant with maskAllInputs but explicit
      text: true,
      email: true,
      number: true,
      tel: true,
    },
    blockSelector: '.ph-no-capture',  // any element with this class is fully blocked
  },
})
```

#### 3. Block Session Replay on Sensitive Pages — URL-Level Config

Configure PostHog to never record on:

- `/pay/*` — public payment page (shows payer name, amount fields)
- `/payment/return` — shows payment status + payer details
- `/payment/start` — payment initiation
- `/dashboard/profile` — shows personal info form

```javascript
posthog.init(POSTHOG_KEY, {
  session_recording: {
    maskAllInputs: true,
    urlBlocklist: [
      '/pay/',
      '/payment/',
      '/dashboard/profile',
    ],
  },
})
```

Additionally, in those page components, call programmatically:

```javascript
// In sensitive page components:
useEffect(() => {
  posthog.stopSessionRecording()
  // no cleanup needed — page unmount or navigation will not restart it
  // until posthog.startSessionRecording() is called on a safe page
}, [])
```

#### 4. Session Replay — Where It IS Allowed

- `/` (landing page) — fully safe, no user data
- `/dashboard` (main dashboard) — safe with input masking
- `/dashboard/collections` — safe
- `/dashboard/collections/new` — safe (no sensitive form data, just collection metadata)
- `/admin/*` — safe for admin review

#### 5. User Identification — Safe Pattern

```javascript
// Only after confirmed login — use internal ID, never PII:
posthog.identify(user._id)  // MongoDB ObjectId string — no name/email/phone

// Set safe properties only:
posthog.people.set({
  role: user.role,          // "member" or "admin"
  // NO email, NO phone, NO name
})
```

For non-logged-in visitors (landing page, `/pay/[slug]`): do NOT call `identify()`. PostHog assigns an anonymous ID automatically.

#### 6. Person Profiles Mode

Set `person_profiles: 'identified_only'` so anonymous events never create permanent person records:

```javascript
posthog.init(POSTHOG_KEY, {
  person_profiles: 'identified_only',  // only create profiles after identify()
})
```

---

## Traffic Source Tracking

PostHog automatically captures `$referrer`, `$referring_domain`, `$initial_referrer`, and all UTM parameters. No extra code needed for referrer tracking. UTM params are captured from the URL on page load.

### Source-Specific Notes

| Source | How PostHog captures it | What you must do |
| --- | --- | --- |
| **Google (organic)** | `google.com` in `$referring_domain` | Nothing — automatic |
| **Google (paid)** | `utm_source=google&utm_medium=cpc` | Add UTM to all Google Ads links |
| **Facebook** | `l.facebook.com` in referrer OR UTMs | Add `utm_source=facebook` to all Facebook posts/ads |
| **Instagram** | Instagram strips referrer headers | **Must** add `utm_source=instagram&utm_medium=social` to every link in bio / stories |
| **TikTok** | TikTok strips referrer headers | **Must** add `utm_source=tiktok&utm_medium=social` to every TikTok link |
| **WhatsApp** | WhatsApp strips all referrers | **Must** add `utm_source=whatsapp&utm_medium=social` to every link shared via WhatsApp |
| **Direct** | No referrer, no UTM | PostHog marks as `direct` automatically |

### Recommended UTM Template for Social Posts

```
https://sarafupay.com/?utm_source=tiktok&utm_medium=social&utm_campaign=launch-2026
https://sarafupay.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch-2026
https://sarafupay.com/?utm_source=whatsapp&utm_medium=referral&utm_campaign=launch-2026
```

### Traffic Source → Action Correlation

With PostHog, you can build a funnel filtered by `utm_source=tiktok` and see:

- How many TikTok visitors landed → registered → created a collection → completed a payment
- This is not possible in Plausible

---

## Product Event Tracking

### Events to Instrument (Manual — No Autocapture)

Properties noted `safe` contain no PII. All properties must be verified before shipping.

#### Landing & Auth

| Event | Trigger | Safe properties |
| --- | --- | --- |
| `landing_viewed` | `/` page load | `{ source: $referring_domain, utm_source }` — captured automatically |
| `hero_cta_clicked` | Click main CTA button on hero | `{ cta_label: "Get Started" }` |
| `register_clicked` | Click register in navbar | (no properties needed) |
| `login_clicked` | Click login in navbar | (no properties needed) |
| `google_login_clicked` | Click Google auth button | (no properties needed) |
| `account_registered` | Successful registration response | `{ method: "email" or "google" }` |
| `account_logged_in` | Successful login response | `{ method: "email" or "google" }` |

#### Dashboard & Collections

| Event | Trigger | Safe properties |
| --- | --- | --- |
| `dashboard_viewed` | `/dashboard` page load | (none — user already identified) |
| `admin_dashboard_viewed` | `/admin` page load | (none) |
| `collection_create_clicked` | Click "Create Project" button | (none) |
| `collection_created` | Successful collection save | `{ collection_type: "wedding" }` — type only, no title/amount |
| `collection_link_copied` | Click "Copy link" | `{ collection_type }` — type only |
| `whatsapp_share_clicked` | Click WhatsApp share button | `{ collection_type }` |
| `qr_downloaded` | Click QR download | (none) |

#### Payment Funnel

| Event | Trigger | Safe properties |
| --- | --- | --- |
| `public_payment_page_viewed` | `/pay/[slug]` load | `{ collection_type }` — from public page metadata, not payment data |
| `payment_started` | Click pay / submit amount form | (no amount, no name — just the fact it started) |
| `payment_return_viewed` | `/payment/return` load | `{ status: "completed" or "pending" or "failed" }` — status only |
| `payment_completed` | Return page shows completed status | (no properties beyond the status — amount must NOT be sent) |
| `receipt_print_clicked` | Click print in receipt dialog | (none) |

### What NOT to Send as Event Properties

```
❌ amount, currency, payment_amount
❌ email, phone, fullName, customerName
❌ snippeReference, externalReference, webhookPayload
❌ monthPaidFor (if it contains user-identifiable info)
❌ jwtToken, cookieValue, sessionToken
❌ collection title (if it contains a person's name, e.g. "Juma's Wedding Fund")
❌ any form field value
```

---

## Session Replay — Allowed vs Blocked Pages

| Page | Session Replay | Reason |
| --- | --- | --- |
| `/` (landing) | ✅ Allowed | Public, no user data |
| `/register` | ✅ Allowed (inputs masked) | Onboarding flow — valuable for UX review |
| `/login` | ✅ Allowed (inputs masked) | Auth flow — valuable for UX review |
| `/dashboard` | ✅ Allowed | Main dashboard — safe |
| `/dashboard/collections` | ✅ Allowed | Collections list — safe |
| `/dashboard/collections/new` | ✅ Allowed (inputs masked) | Collection form — useful for UX but mask all inputs |
| `/dashboard/payments` | ✅ Allowed | Payment list — amounts visible but no credential risk |
| `/admin/*` | ✅ Allowed (inputs masked) | Admin only — safe for internal review |
| `/dashboard/profile` | ❌ Blocked | Shows name, phone, email, bio — personal info |
| `/pay/[slug]` | ❌ Blocked | Shows payer name field, amount field — payment sensitive |
| `/payment/start` | ❌ Blocked | Payment initiation |
| `/payment/return` | ❌ Blocked | Shows payment result, potentially payer name |

---

## `/admin/analytics` Dashboard Design

### Approach: PostHog Shared Dashboard Embed + Custom Sections

PostHog allows creating a "Shared Dashboard" — a public-share link you can embed as an iframe. This gives us the PostHog analytics UI inside our admin panel without building custom charts for everything.

For the payment funnel section, we will build a custom view using data from our own MongoDB (since payment data is in our DB and we don't send amounts to PostHog).

### Layout

```
/admin/analytics
│
├── HEADER
│   "Analytics · SarafuPay Platform"
│   [date range selector] [Powered by PostHog]
│
├── ROW 1 — KPI Summary chips (4 across)
│   Unique Visitors | Total Sessions | Registrations | Payments Completed
│   (first 3 from PostHog, last from our own DB)
│
├── ROW 2 — Traffic (2 columns, lg:grid-cols-[3fr_2fr])
│   LEFT:  Visitors over time — area chart, green gradient, 30-day view
│   RIGHT: Top Sources — ranked horizontal bars
│          1. TikTok     (gold bar, #1 rank)
│          2. Instagram  (emerald)
│          3. WhatsApp   (emerald)
│          4. Facebook   (slate)
│          5. Google     (slate)
│          6. Direct     (slate)
│
├── ROW 3 — User funnel (full-width step cards)
│   [Landing] → [Register clicked] → [Registered] → [Dashboard] →
│   [Collection created] → [Link shared] → [Payment started] → [Payment completed]
│   Each step: count + conversion % from previous step
│
├── ROW 4 — Session breakdown (2 columns)
│   LEFT:  Device breakdown — mobile / desktop / tablet pill bars
│   RIGHT: Active right now — "X users on site" + recent page paths
│          (from PostHog Live Events if supported by embed, or manual fetch)
│
├── ROW 5 — Recent Live Events feed (full-width)
│   Animated feed: last 20 events from PostHog (event name + page + time)
│   Colors: blue for auth, amber for collection, green for payment
│
├── ROW 6 — Payment funnel (from our MongoDB, not PostHog)
│   "Payment Data (from platform database)"
│   This week: X started → Y completed → Z%
│   Revenue per source (if UTM data is available)
│
└── FOOTER
    "Analytics via PostHog · Session replay masked · No PII stored"
```

### Implementation Approach for Embed

```tsx
// Phase 6 — PostHog embed placeholder
<iframe
  src="https://us.posthog.com/shared_dashboard/TOKEN"
  width="100%"
  height="1400"
  frameBorder="0"
  loading="lazy"
/>
```

Custom sections (funnel, payment data) will be built as React components using data from `/api/dashboard/admin` and PostHog's REST API (with API key stored only in server env).

---

## Privacy Policy Update Required (Phase 7)

Before production launch with analytics enabled, add to `/privacy`:

```
Analytics & Product Data

SarafuPay uses PostHog to understand how people use our platform.
This helps us improve the product and fix issues.

What we collect:
- Page views and navigation paths (anonymous)
- Button clicks and feature interactions (anonymous)
- Session recordings on safe pages to review UX — all form inputs are masked
- Traffic source (where you came from — referrer or UTM parameter)
- Device type and browser (no GPS, no precise location)

What we do NOT collect:
- Passwords, payment credentials, or financial details
- Your name, email, or phone number in analytics
- Form input values (all inputs are masked)
- Payment references or Snippe transaction data

PostHog is GDPR-compliant. Data is processed anonymously where possible.
Review PostHog's data policy at posthog.com/privacy.
```

---

## Frontend Files to Instrument

| File | Events | Notes |
| --- | --- | --- |
| `client/app/layout.tsx` | PostHog provider init + route change capture | Wrap once at root |
| `client/components/landing/HeroSection.tsx` | `hero_cta_clicked` | |
| `client/components/layout/Navbar.tsx` | `register_clicked` | |
| `client/app/login/page.tsx` | `login_clicked` | |
| `client/app/register/page.tsx` | `account_registered` | Method only |
| `client/components/auth/GoogleAuthButton.tsx` | `google_login_clicked` | |
| `client/app/dashboard/page.tsx` | `dashboard_viewed` | Post-identify |
| `client/app/admin/page.tsx` | `admin_dashboard_viewed` | Post-identify |
| `client/app/dashboard/collections/new/page.tsx` | `collection_create_clicked` | |
| `client/components/collections/PaymentLinkCard.tsx` | `collection_link_copied`, `whatsapp_share_clicked`, `qr_downloaded` | Type only |
| `client/app/pay/[slug]/page.tsx` | `public_payment_page_viewed`, `payment_started` | Disable replay |
| `client/app/payment/return/page.tsx` | `payment_return_viewed`, `payment_completed` | Disable replay |
| `client/components/payments/PaymentReceiptDialog.tsx` | `receipt_print_clicked` | |
| `client/app/dashboard/profile/page.tsx` | (none — no events needed) | Disable replay |
| `client/app/payment/start/page.tsx` | (none) | Disable replay |

---

## Phased Implementation Plan

### Phase 1 — Text Contrast / Readability Polish

Status: ✅ Complete

### Phase 2 — PostHog Account + SDK Setup (est. 30 min)

1. Create PostHog account at `us.posthog.com` (US cloud — GDPR-compliant)
2. Create project for "SarafuPay"
3. Get `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
4. Install: `npm install posthog-js`
5. Add env vars to `.env.local` (client prefix required for Next.js)
6. Create `client/lib/posthog.ts` — singleton init with privacy config
7. Create `client/components/providers/PostHogProvider.tsx` — React context wrapper
8. Add `PostHogProvider` to `client/app/layout.tsx`
9. Verify pageviews appear in PostHog dashboard

Privacy config applied at init:

```javascript
posthog.init(key, {
  api_host: host,
  autocapture: false,           // disable all auto-click capture
  capture_pageview: false,      // manual pageview per route
  capture_pageleave: true,      // safe — just "left page" event
  person_profiles: 'identified_only',
  session_recording: {
    maskAllInputs: true,
    urlBlocklist: ['/pay/', '/payment/', '/dashboard/profile'],
  },
})
```

### Phase 3 — Route-Based Pageview Tracking + Traffic Sources (est. 1–2 hours)

- Instrument `layout.tsx` with Next.js router `usePathname` to fire `posthog.capture('$pageview')` on route change
- UTM params auto-captured by PostHog on first page load
- Verify: TikTok / Instagram / WhatsApp links with UTMs show as distinct sources
- Test from multiple devices — verify mobile/desktop breakdown

### Phase 4 — Product Event Instrumentation (est. 2–4 hours)

- Instrument each file in the table above
- Add `posthog.identify(user._id)` in `useAuth` after confirmed login
- Add `posthog.reset()` in logout function (already in `useAuth.ts`)
- Test full funnel: landing → register → dashboard → collection → payment
- Verify all 12+ events appear in PostHog Live Events feed
- Verify no PII in event properties (audit each event in PostHog UI)

### Phase 5 — Session Replay Audit (est. 1 hour)

- Enable session replay on safe pages
- Confirm replay is blocked on `/pay/`, `/payment/`, `/dashboard/profile`
- Watch 3–5 recordings on landing page and dashboard to verify masking works
- Confirm all inputs show `***` in recordings

### Phase 6 — `/admin/analytics` Dashboard (est. 4–8 hours)

- Create `client/app/admin/analytics/page.tsx`
- Add to `adminNav` in `client/lib/constants.ts`
- Add to admin sidebar + mobile More menu
- Phase 6a: Embed PostHog shared dashboard iframe (fast, immediate value)
- Phase 6b: Build custom sections (top sources bar chart, payment funnel from MongoDB, live events feed from PostHog REST API)
- Use Recharts for custom charts — consistent with existing revenue chart style

### Phase 7 — Privacy Policy Update (est. 30 min)

- Update `client/app/privacy/page.tsx` with PostHog disclosure
- Keep it plain language: what is collected, what is NOT collected, how to opt out

---

## Comparison Summary

| Capability | Plausible | PostHog | SarafuPay needs |
| --- | --- | --- | --- |
| Pageview tracking | ✅ | ✅ | ✅ |
| Traffic sources + UTM | ✅ | ✅ | ✅ |
| Social source performance | ⚠️ referrers only | ✅ with UTMs + event depth | ✅ |
| Live active sessions | ❌ | ✅ | ✅ |
| Recent live events feed | ❌ | ✅ | ✅ |
| Funnel conversion with % | ⚠️ goals only | ✅ full funnel | ✅ |
| Traffic source → action | ❌ | ✅ | ✅ |
| User paths | ❌ | ✅ | ✅ |
| Session replay | ❌ | ✅ (masked) | ✅ |
| Custom event properties | ⚠️ limited | ✅ | ✅ |
| User identification | ❌ | ✅ (safe ID only) | needed |
| Embed in admin panel | ✅ | ✅ | ✅ |
| Free tier | ❌ $9/mo min | ✅ $0 up to 1M events | ✅ |
| Privacy-safe by default | ✅ | ⚠️ needs config | configurable |
| Cookieless by default | ✅ | ❌ (configurable) | acceptable |

Final decision: **PostHog — configured safely as documented above.**

---

> Revised: 2026-05-19 | Phase 1 complete | Phases 2–7 pending approval to implement
