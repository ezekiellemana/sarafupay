# SarafuPay — Feature Roadmap

**Branch:** `feature-roadmap`  
**Stable baseline:** `v1.0.0-mvp` (tag on `main`)  
**Rule:** Never merge anything that breaks payment flow, Snippe checkout, webhook verification, dashboard stats, or CSV export.

---

## How to Read This Document

Each feature lists:
- **Purpose** — why it matters
- **User story** — who does what and why
- **Frontend** — pages and components touched
- **Backend** — routes, controllers, models touched
- **Risk** — Low / Medium / High (relative to breaking the working MVP)
- **Priority** — High / Medium / Low (user value vs. effort)
- **Touches payment logic** — Yes / No (payment logic = Snippe API calls, webhook handler, session creation, verify path, stats aggregation)

---

## Phase 1 — Must-Have Platform Features

These close the most obvious gaps for real users managing collections today.

---

### 1.1 Edit Collection Details

**Purpose:** Owners need to fix typos, update descriptions, change targets, or adjust contribution amounts after creating a collection. Currently there is no edit UI — the collection is locked after creation.

**User story:** As a collection owner, I want to edit my collection's title, description, target amount, and other details so that I can keep my payment page accurate without deleting and recreating it.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — add Edit button that opens an edit form
- `client/components/collections/CollectionForm.tsx` — already exists for create; extend to support edit mode (pre-populate fields, change submit action)

**Backend:**
- Route: `PATCH /api/collections/:id` — already exists (`collection.controller.ts` → `updateCollectionHandler`)
- No model changes needed — all editable fields already exist on the Project model (`title`, `description`, `targetAmount`, `monthlyContributionAmount`, `suggestedAmount`, `minimumAmount`, `allowCustomAmount`, `endDate`, `rules`)

**Risk:** Low — PATCH endpoint exists and is tested. No payment logic touched. Stats are not recalculated on edit.

**Priority:** High — this is a basic expectation for any web app.

**Touches payment logic:** No.

---

### 1.2 Pause / Close / Reactivate Collection

**Purpose:** Owners need lifecycle control. A paused collection rejects new payments but keeps all existing records. A closed collection is archived. Reactivation brings a paused collection back.

**User story:** As a collection owner, I want to pause my collection during a break and reactivate it later, or close it permanently once the goal is met, without losing any payment history.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — status action buttons (Pause / Close / Reactivate) with confirmation dialog
- `client/components/ui/dialog` — confirmation modal before destructive status changes
- `client/components/shared/StatusBadge.tsx` — already exists; ensure it renders all status values correctly

**Backend:**
- Route: `PATCH /api/collections/:id` — update `status` field
- `server/src/controllers/collection.controller.ts` — `updateCollectionHandler` needs to validate the status transition (active → paused, active → closed, paused → active)
- `server/src/controllers/payment.controller.ts` — `createPublicSession` must check `project.status === "active"` before creating a Snippe session. If paused or closed, return 400.
- Model: `Project.model.ts` already has `status` enum: `draft | active | paused | completed | closed`

**Risk:** Medium — requires touching `createPublicSession` to guard against payments on non-active collections. The guard itself is simple, but any change to the payment creation path needs careful testing.

**Priority:** High — without this, owners have no way to stop new payments once a collection ends.

**Touches payment logic:** Yes — `createPublicSession` must check project status before opening a Snippe session. Webhook handler does NOT need changes (a completed payment stays completed regardless of current project status).

---

### 1.3 Payment Filtering and Search

**Purpose:** Owners with many contributors need to search by name, phone, status, or date range instead of scrolling through an unfiltered table.

**User story:** As a collection owner, I want to filter my contributor list by payment status (completed / pending / failed) and search by contributor name or phone number so I can quickly find specific records.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — add filter controls (status dropdown, search input, date range)
- `client/components/collections/ContributorTable.tsx` — accept filter props; apply client-side filtering or pass query params to API
- `client/components/dashboard/PaymentTable.tsx` — same for the main payments page

**Backend:**
- Route: `GET /api/collections/:id/payments` — already exists; extend to accept query params: `?status=completed&search=john&from=2026-01-01&to=2026-12-31`
- `server/src/controllers/collection.controller.ts` → `collectionPaymentsHandler` — add Mongoose query filters for status, name regex, phone regex, date range
- No model changes needed

**Risk:** Low — read-only query changes. No write path or payment logic touched.

**Priority:** High — becomes essential as any collection grows past 20 contributors.

**Touches payment logic:** No.

---

### 1.4 Collection Analytics

**Purpose:** Beyond total collected and contributor count, owners want to understand payment trends: daily/weekly inflow, completion rate, average contribution, and progress toward target.

**User story:** As a collection owner, I want to see a progress bar toward my target amount, a breakdown of completed vs. pending vs. failed payments, and a simple chart of payments over time so I can understand how my collection is performing.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — analytics section with charts
- `client/components/collections/CollectionStats.tsx` — already exists; extend with new metrics
- `client/components/shared/AnimatedProgressBar.tsx` — already exists for target progress
- New chart component (e.g., using Recharts or a lightweight canvas lib) — daily payment bar chart

**Backend:**
- Route: `GET /api/collections/:id/summary` — already exists; extend response to include: `completedCount`, `pendingCount`, `failedCount`, `averageAmount`, `completionRate`, `dailyTotals` (array of date + amount for the last 30 days)
- `server/src/controllers/collection.controller.ts` → `collectionSummaryHandler` — add MongoDB aggregation for daily breakdown
- No model changes needed

**Risk:** Low — new aggregation queries on read-only data. No write path touched.

**Priority:** Medium — useful, but owners can manage without it initially.

**Touches payment logic:** No.

---

### 1.5 Receipt Download / Printable Receipt

**Purpose:** Contributors want proof of payment for accounting, reimbursement, or their own records. Currently there is a `PaymentReceiptDialog` component but no download option.

**User story:** As a contributor, after making a payment I want to download or print a PDF receipt showing my name, amount, reference number, project name, and timestamp so I have proof of my contribution.

**Frontend:**
- `client/components/payments/PaymentReceiptDialog.tsx` — already exists; add a "Download PDF" button
- Use `window.print()` with a print-specific CSS stylesheet as the simplest approach (no new library needed). A richer alternative is `jsPDF` or `html2canvas` for a real PDF file.
- `client/app/dashboard/payments/page.tsx` — receipt accessible from payment history
- `client/app/payment/return/page.tsx` — receipt accessible from the confirmation page after payment

**Backend:**
- No changes needed — all receipt data is already returned by `GET /api/payments/:id` and `GET /api/payments/verify/:reference`

**Risk:** Low — purely frontend. No backend changes. No payment logic.

**Priority:** Medium — expected for any fintech product.

**Touches payment logic:** No.

---

### 1.6 Share Payment Link Buttons

**Purpose:** Collection owners need to share their payment link instantly via WhatsApp (dominant in Tanzania), copy-to-clipboard, or display a QR code. Currently owners must manually copy the URL from the browser.

**User story:** As a collection owner, I want to share my payment link with one tap via WhatsApp or copy it to my clipboard so contributors can find and pay easily.

**Frontend:**
- `client/components/collections/PaymentLinkCard.tsx` — already exists; add three action buttons: WhatsApp share, Copy link, Show QR code
- WhatsApp share: `https://wa.me/?text=Pay+for+<title>: <URL>` — no library needed
- Copy link: `navigator.clipboard.writeText(url)` — no library needed
- QR code: `qrcode.react` npm package (small, well-maintained) renders QR inline — show in a dialog
- `client/app/dashboard/collections/[id]/page.tsx` — ensure PaymentLinkCard is visible

**Backend:**
- No changes needed — `publicPaymentLink` is already returned by `GET /api/collections/:id`

**Risk:** Low — 100% frontend. No backend. No payment logic. Pure UI addition.

**Priority:** High — WhatsApp sharing is how Tanzania distributes payment links. This has the highest real-world impact per line of code.

**Touches payment logic:** No.

---

### 1.7 Owner Thank-You Message

**Purpose:** After a successful payment, contributors see a generic confirmation screen. Owners want to add a personal thank-you message (e.g., "Thank you for contributing to our wedding — Ezekiel & Amina").

**User story:** As a collection owner, I want to set a custom thank-you message for my collection so contributors feel acknowledged after paying.

**Frontend:**
- `client/components/collections/CollectionForm.tsx` — add `thankYouMessage` textarea field (already in the model, just not in the form)
- `client/app/payment/return/page.tsx` — display the thank-you message from the collection if present (fetch via `GET /api/collections/public/:slug` or include in the verify response)

**Backend:**
- No model changes — `thankYouMessage` already exists on the Project model
- `PATCH /api/collections/:id` already accepts field updates — no new route needed
- `GET /api/payments/verify/:reference` — optionally include the populated project's `thankYouMessage` in the response so the return page can display it without an extra API call

**Risk:** Low — field exists in model, PATCH endpoint exists. The only new logic is displaying the message on the return page.

**Priority:** High — personal touch that significantly improves contributor experience at zero backend cost.

**Touches payment logic:** No.

---

### 1.8 Pending / Failed Payment Visibility

**Purpose:** Owners currently see all payment statuses mixed together. They need a clear view of who has a pending or failed payment so they can follow up personally.

**User story:** As a collection owner, I want to see a dedicated list of pending and failed payments — with contributor name, phone, amount, and time — so I can follow up with people who started but didn't complete a payment.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — add a "Pending & Failed" tab or section alongside the contributor list
- `client/components/shared/StatusBadge.tsx` — already exists; ensure `pending` and `failed` render with distinct colors
- `client/components/collections/ContributorTable.tsx` — add a tab filter for `status`

**Backend:**
- Route: `GET /api/collections/:id/payments?status=pending,failed` — extend the existing endpoint (see Feature 1.3)
- No model changes needed
- Note: stale pending sessions (Snippe sessions that expired without payment) remain as `pending` — consider whether to show a "Stale" indicator for payments older than 24h

**Risk:** Low — read-only query. No write path or payment logic.

**Priority:** High — follow-up on pending payments is a primary use case for group contribution owners.

**Touches payment logic:** No.

---

## Phase 2 — Trust and Business Features

These build credibility and professional appearance for owners running real collections.

---

### 2.1 Public Collection Page Preview

**Purpose:** Before sharing, owners want to see exactly what contributors will see when they open the payment link — the public `/pay/[slug]` page with their details.

**User story:** As a collection owner, I want to preview my public payment page from my dashboard so I can verify it looks correct before sharing the link.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — "Preview Public Page" button that opens `/pay/[slug]` in a new tab
- The public page itself (`client/app/pay/[slug]/page.tsx`) already exists — no changes needed
- Optional: inline iframe preview modal (medium effort, not required for MVP of this feature)

**Backend:**
- No changes needed — `slug` is already on the Project model and returned by `GET /api/collections/:id`

**Risk:** Low — read-only, no backend changes.

**Priority:** Medium — quality-of-life for owners, but the URL is already shareable.

**Touches payment logic:** No.

---

### 2.2 Owner Business / Display Name

**Purpose:** On the public payment page contributors see who they are paying. Currently only the collection title is shown — there is no organization or owner display name. This matters for trust.

**User story:** As a collection owner, I want to set a business or display name on my profile so contributors can see who they are paying (e.g., "Amani Welfare Group" instead of just "ezekiel@gmail.com").

**Frontend:**
- `client/app/dashboard/profile/page.tsx` — add `displayName` / `organizationName` field to the profile form
- `client/app/pay/[slug]/page.tsx` — show owner display name on the public payment page

**Backend:**
- Model: `User.model.ts` — add `displayName: String` (optional)
- Route: `PATCH /api/auth/profile` — already exists; include `displayName` in the allowed update fields
- Route: `GET /api/collections/public/:slug` — populate owner's `displayName` in the response

**Risk:** Low — new optional field on the User model. No indexes required. No payment logic.

**Priority:** Medium — builds trust on the public payment page.

**Touches payment logic:** No.

---

### 2.3 Collection Category Badges

**Purpose:** The Project model already has a `collectionType` enum with 12 types (wedding, charity, event, school, church, etc.) but this information is never shown in the UI. Displaying a badge improves discoverability and trust.

**User story:** As a contributor visiting a payment link, I want to see what type of collection this is (e.g., "Wedding", "Charity", "School") so I know the context before paying.

**Frontend:**
- `client/app/pay/[slug]/page.tsx` — display a category badge next to the collection title
- `client/app/dashboard/collections/[id]/page.tsx` — show and allow editing of `collectionType`
- `client/components/collections/CollectionForm.tsx` — add `collectionType` select dropdown (field exists in model, just not in the form)
- `client/components/shared/StatusBadge.tsx` — extend or create a `CategoryBadge` variant

**Backend:**
- No model changes — `collectionType` already exists
- No new routes — `collectionType` is already returned by existing endpoints

**Risk:** Low — display-only change. No business logic.

**Priority:** Low — visual improvement, not blocking.

**Touches payment logic:** No.

---

### 2.4 Report / Flag a Collection

**Purpose:** Prevent misuse. Contributors who suspect a fraudulent collection can flag it for admin review. This is a trust signal for legitimate owners.

**User story:** As a contributor, if I suspect a payment link is fraudulent, I want to report it so the platform can investigate and protect others.

**Frontend:**
- `client/app/pay/[slug]/page.tsx` — discreet "Report this collection" link at the bottom
- New modal with a short free-text reason field and submit button

**Backend:**
- New model: `Report.model.ts` — fields: `collectionId`, `reporterIp`, `reason`, `createdAt`, `reviewed` (boolean)
- New route: `POST /api/reports` — no auth required; rate-limited; saves the report
- Admin route: `GET /api/admin/reports` — list unreviewed reports
- Admin UI: `client/app/admin/page.tsx` or a new `/admin/reports` page

**Risk:** Low — new isolated model and route. Zero overlap with payment logic.

**Priority:** Low — important eventually, not urgent for early users.

**Touches payment logic:** No.

---

### 2.5 Support / Contact Page

**Purpose:** Users have no way to contact SarafuPay support. A simple contact page with an email link or form is a baseline expectation.

**User story:** As a user with a problem, I want to find a way to contact support so I can get help without hunting for an email address.

**Frontend:**
- New page: `client/app/contact/page.tsx` — email link (`support@sarafupay.co.tz`), brief FAQ, link to Terms and Privacy
- `client/components/layout/Footer.tsx` — add "Contact" link to the Footer nav
- `client/components/layout/Navbar.tsx` — optionally add "Help" link

**Backend:**
- Optional: `POST /api/support/contact` — save message to DB or forward to an email service
- For MVP of this feature: a static page with a `mailto:` link is sufficient

**Risk:** Low — static page. No payment logic.

**Priority:** Medium — legally and practically expected before public launch.

**Touches payment logic:** No.

---

### 2.6 Notification Placeholders (Email / SMS)

**Purpose:** Set up the notification infrastructure so that when Snippe confirms a payment, the contributor receives a receipt and the owner receives an alert. The actual sending can be filled in later (e.g., Brevo, Africa's Talking).

**User story:** As a contributor, after paying I want to receive an SMS or email confirmation so I have a record without needing to log in. As an owner, I want to be notified when someone pays so I can acknowledge them.

**Frontend:**
- `client/app/dashboard/profile/page.tsx` — notification preferences toggle (email / SMS on payment received)
- No immediate UI change for contributors — notification arrives externally

**Backend:**
- `server/src/services/notification.service.ts` — new file; stub functions `sendPaymentConfirmation(payment)` and `notifyOwner(payment)` that log to console now, send via API later
- `server/src/services/payment.service.ts` → `handleSnippeWebhook` — call `sendPaymentConfirmation` and `notifyOwner` after marking payment completed
- User model — add `notificationPreferences: { email: Boolean, sms: Boolean }` (optional, default true)

**Risk:** Medium — the stub approach is safe (console.log only), but any future live integration near the webhook handler requires care. The webhook handler itself is not modified — only the service called after the payment is already saved.

**Priority:** Low for stubs, High when real notifications are wired.

**Touches payment logic:** No — called after payment is already saved and stats updated.

---

### 2.7 Admin Monitoring Improvements

**Purpose:** The admin panel shows stats but lacks drill-down: no per-collection view, no user activity timeline, no ability to mark a collection as reviewed or suspended.

**User story:** As a platform admin, I want to see which collections are collecting the most money, view any collection's full payment list, and suspend a collection if needed, so I can monitor for misuse.

**Frontend:**
- `client/app/admin/projects/page.tsx` — add collection status filter, sort by `totalCollected`, link to collection detail
- `client/app/admin/payments/page.tsx` — add date range filter, collection filter, export button
- New: `client/app/admin/collections/[id]/page.tsx` — admin view of any collection's payments

**Backend:**
- `GET /api/admin/members` — already has search/filter; extend similarly for projects
- New route: `GET /api/admin/collections` — list all collections with owner info, total, status
- New route: `PATCH /api/admin/collections/:id/status` — admin can set any collection status (suspend = `closed`)
- `admin.controller.ts` — new handler functions

**Risk:** Low for read routes. Medium for the status-change route (admin action that affects the public payment page — a closed collection rejects new payments).

**Priority:** Medium — needed before scaling to many users.

**Touches payment logic:** The status guard in `createPublicSession` (Feature 1.2) means closing a collection via admin will correctly block new payments. No other payment logic changes.

---

## Phase 3 — Growth Features

These increase reach, shareability, and platform stickiness.

---

### 3.1 QR Code for Payment Links

**Purpose:** QR codes are displayed at physical events (weddings, church, fundraisers) so contributors can scan and pay without typing a URL. This is high-value for Tanzania's event culture.

**User story:** As a collection owner, I want to generate a QR code for my payment link so I can display it on a projector, poster, or printed flyer at my event.

**Frontend:**
- `client/components/collections/PaymentLinkCard.tsx` — QR code display in a dialog (already noted in Feature 1.6 as part of share buttons — these two features share implementation)
- `client/app/dashboard/collections/[id]/page.tsx` — "Download QR" button that renders the QR as a PNG using `qrcode.react` canvas export
- Package: `qrcode.react` (MIT license, no backend required)

**Backend:**
- No changes needed

**Risk:** Low — 100% frontend. No backend.

**Priority:** High — QR codes at physical events are a core use case for Tanzania collections.

**Touches payment logic:** No.

---

### 3.2 WhatsApp Share Message Generator

**Purpose:** A pre-written WhatsApp message with the payment link, collection name, amount, and a personal appeal reduces friction for owners sharing with their groups.

**User story:** As a collection owner, I want to generate a WhatsApp message with my payment link pre-filled so I can send it to my group chat with one tap.

**Frontend:**
- `client/components/collections/PaymentLinkCard.tsx` — "Share on WhatsApp" button opens `https://wa.me/?text=<encoded message>` — already in Feature 1.6
- Add a text preview of the generated message so owners can see and edit it before sharing
- No library needed — native Web Share API (`navigator.share`) as a fallback for mobile

**Backend:**
- No changes needed

**Risk:** Low — pure frontend.

**Priority:** High — WhatsApp is the primary communication channel in Tanzania.

**Touches payment logic:** No.

---

### 3.3 Public Contributor List Toggle

**Purpose:** Some collection owners want to publicly display who has contributed (social proof, accountability for group contributions). Others need privacy. This should be owner-controlled.

**User story:** As a collection owner, I want to optionally show a list of contributors on my public payment page — with name and amount — to encourage others to contribute, or hide it entirely for privacy-sensitive collections.

**Frontend:**
- `client/components/collections/CollectionForm.tsx` — add `showContributorList` toggle (boolean)
- `client/app/pay/[slug]/page.tsx` — conditionally render a contributor list section (names + amounts, no phone numbers)

**Backend:**
- Model: `Project.model.ts` — add `showContributorList: Boolean` (default: false, opt-in)
- Route: `GET /api/collections/public/:slug` — include `showContributorList` and, if true, the completed-payment contributor list (name + amount only)
- No new route — extend the existing public collection endpoint

**Risk:** Low — new optional field and a conditional query. No payment logic.

**Priority:** Medium — social proof is valuable for fundraising but not critical.

**Touches payment logic:** No.

---

### 3.4 Custom Branding per Collection

**Purpose:** Owners running professional or business collections want to add a cover image or color accent to differentiate their page from a generic SarafuPay page.

**User story:** As a collection owner running a business fundraiser, I want to upload a cover image and choose an accent color for my payment page so it feels on-brand.

**Frontend:**
- `client/components/collections/CollectionForm.tsx` — add `coverImageUrl` field (currently in the model but not the form) and a color picker for accent
- `client/app/pay/[slug]/page.tsx` — render cover image and apply accent color via inline style
- Image upload: use a file input that uploads to an object storage service (e.g., DigitalOcean Spaces, Cloudinary) and stores the URL

**Backend:**
- Model: `Project.model.ts` — `coverImageUrl` already exists; add `accentColor: String` (optional, hex code)
- New route or middleware: file upload endpoint (e.g., `POST /api/uploads/cover-image`) — multer + storage adapter
- This is the highest-effort feature in Phase 3 due to file storage setup

**Risk:** Medium — file upload adds infra complexity (storage bucket, signed URLs, size limits). No payment logic, but a new attack surface (file type validation required).

**Priority:** Low — nice to have, but the plain SarafuPay page already looks good.

**Touches payment logic:** No.

---

### 3.5 Multiple Currencies

**Purpose:** If Snippe expands to support KES, UGX, or USD, SarafuPay should be able to route payments in those currencies without a full rewrite.

**User story:** As a Kenyan diaspora member organizing a collection for a Tanzania-based event, I want to pay in KES so I don't need to calculate the exchange rate manually.

**Frontend:**
- `client/components/collections/CollectionForm.tsx` — currency selector (currently hardcoded to TZS)
- `client/app/pay/[slug]/page.tsx` — display the collection currency and format amounts accordingly

**Backend:**
- Model: `Project.model.ts` — `currency` already exists (default: TZS)
- `server/src/services/snippe.service.ts` — pass `currency` from the project to the Snippe session payload
- Payment model `currency` already exists

**Risk:** Medium — touches `snippe.service.ts` (the Snippe session creation path). Must verify Snippe actually supports the target currencies before enabling. Do not implement until confirmed with Snippe.

**Priority:** Low — TZS only for now. Revisit when Snippe confirms multi-currency support.

**Touches payment logic:** Yes — modifies the Snippe session payload. Flag and test carefully.

---

### 3.6 Collection Templates

**Purpose:** Instead of filling in a blank form, owners pick a template (Wedding, Charity, School Fees, Church Tithe, Group Trip, Business) which pre-fills a sensible title, description, and contribution amount.

**User story:** As a first-time collection owner, I want to pick from a set of templates so I can create a collection in 30 seconds without writing everything from scratch.

**Frontend:**
- `client/app/dashboard/collections/new/page.tsx` — template picker screen before showing the CollectionForm
- `client/components/collections/CollectionForm.tsx` — accept initial values from the selected template; user can override any field
- New component: `TemplatePickerGrid.tsx` — grid of template cards with icons and descriptions

**Backend:**
- No changes needed — templates are static client-side data; they just pre-populate the existing create form
- `collectionType` enum already covers all the template categories

**Risk:** Low — 100% frontend. No backend changes.

**Priority:** Medium — reduces new-user friction significantly.

**Touches payment logic:** No.

---

## Phase 4 — Advanced Features

These require significant infrastructure or are dependent on external provider capabilities.

---

### 4.1 Team Members / Assistants for a Collection

**Purpose:** Large collections (church fundraisers, schools) are managed by a committee — multiple people need dashboard access to the same collection.

**User story:** As a collection owner, I want to invite a co-organizer by phone number or email so they can view payments and export reports without sharing my login credentials.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — "Team" tab with invite form and member list
- New page: `client/app/dashboard/collections/[id]/team/page.tsx`

**Backend:**
- New model: `CollectionMember.model.ts` — `collectionId`, `userId`, `role` (viewer / editor), `invitedBy`, `joinedAt`
- New routes: `POST /api/collections/:id/members`, `GET /api/collections/:id/members`, `DELETE /api/collections/:id/members/:userId`
- Authorization middleware — all collection routes must check owner OR team member with sufficient role

**Risk:** High — authorization model change. Every collection endpoint needs a role check. Significant refactor risk.

**Priority:** Low for solo operators. Medium once collections grow to committees.

**Touches payment logic:** No — but touches authorization on every payment-adjacent route.

---

### 4.2 Withdraw / Payout Tracking

**Purpose:** Owners want to log when they withdrew collected money (e.g., via M-Pesa bank withdrawal) and see a running balance of collected vs. withdrawn.

**User story:** As a collection owner, I want to record when I withdraw collected funds and see my remaining balance so I have a complete audit trail.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — "Withdrawals" section with a log of manual withdrawal entries
- Form: amount, date, note (e.g., "M-Pesa withdrawal to 0712xxxxxx")

**Backend:**
- New model: `Withdrawal.model.ts` — `collectionId`, `ownerId`, `amount`, `note`, `withdrawnAt`
- New routes: `POST /api/collections/:id/withdrawals`, `GET /api/collections/:id/withdrawals`
- Collection summary endpoint — include `totalWithdrawn` and `netBalance` (totalCollected - totalWithdrawn)
- Note: this is record-keeping only; no actual payout API call is made (Snippe payout API, if it exists, is a separate integration)

**Risk:** Low for the record-keeping model. Medium if a real Snippe payout API is integrated.

**Priority:** Medium — useful for accountability, not required for collecting.

**Touches payment logic:** No — record-keeping only.

---

### 4.3 Recurring / Monthly Contributions

**Purpose:** The `ContributionPlan` model already exists in the codebase (with status active/paused/completed and `monthlyAmount`) but is currently unused. This feature activates it: members commit to a monthly amount and are automatically reminded.

**User story:** As a member of a monthly savings group (chama), I want to set up a recurring contribution so I am reminded each month and my payment history is tracked automatically.

**Frontend:**
- `client/app/payment/start/page.tsx` — "Set up recurring" toggle
- `client/app/dashboard/payments/page.tsx` — show contribution plan status
- New page: `client/app/dashboard/plans/page.tsx` — manage active contribution plans

**Backend:**
- `ContributionPlan.model.ts` — already exists; activate usage
- New routes: `POST /api/plans`, `GET /api/plans/my`, `PATCH /api/plans/:id/pause`, `DELETE /api/plans/:id`
- Scheduled job (cron): monthly reminder notifications (requires notification infrastructure from Feature 2.6)
- Monthly payment creation: either automated (requires stored payment method — complex) or reminder-based (send a link, user pays manually)

**Risk:** High — automated recurring payments require either stored payment credentials (significant security scope) or a reliable cron job + notification pipeline. The reminder-only approach is safer but still requires the notification service.

**Priority:** High product value for chama use cases. Medium implementation priority — wait until notifications (Feature 2.6) are live.

**Touches payment logic:** Yes — automated recurring session creation touches `createPublicSession` or a new scheduled path. Requires careful testing.

---

### 4.4 Email Receipts

**Purpose:** After a confirmed payment, the contributor receives a formatted HTML email receipt to their registered email address.

**User story:** As a contributor, I want an email receipt sent to my inbox immediately after my payment is confirmed so I have a record without needing to log in to the platform.

**Frontend:**
- `client/app/dashboard/profile/page.tsx` — verify email address field
- No other frontend change — email is sent server-side after webhook confirmation

**Backend:**
- Email service: integrate Brevo (formerly Sendinblue), SendGrid, or Postmark — add `EMAIL_API_KEY` to env
- `server/src/services/email.service.ts` — HTML receipt template (collection name, amount, reference, timestamp, owner thank-you message)
- `server/src/services/notification.service.ts` → `sendPaymentConfirmation` — replace stub with real email call
- Called from `handleSnippeWebhook` after payment is marked completed — no change to payment logic, only the post-confirmation hook

**Risk:** Medium — email service integration adds an external dependency to the webhook handler. If the email API is down, the webhook must not fail (wrap email call in try/catch; log error but return 200 to Snippe).

**Priority:** High — a basic expectation for any payment product.

**Touches payment logic:** No — called after payment is already saved, inside a try/catch that cannot affect the webhook response.

---

### 4.5 PDF Reports

**Purpose:** Owners want a formatted PDF summary of a collection — cover page, stats table, contributor list, and a total — for submission to a committee or accounting records.

**User story:** As a collection owner, I want to generate a PDF report of my collection's payments at any time so I can share a professional summary with stakeholders.

**Frontend:**
- `client/app/dashboard/collections/[id]/page.tsx` — "Download PDF Report" button
- Use `@react-pdf/renderer` or `jsPDF` to generate the PDF in the browser from existing data already loaded on the collection detail page

**Backend:**
- Alternatively, generate PDF server-side with `puppeteer` (heavy) or `pdfkit` (lightweight) and return it as a download from `GET /api/collections/:id/export/pdf`
- The browser-side approach (react-pdf) is preferred — avoids server-side PDF deps

**Risk:** Low (browser-side). Medium (server-side due to puppeteer memory/timeout risk).

**Priority:** Low — CSV export already covers the data need. PDF is a presentation layer.

**Touches payment logic:** No.

---

### 4.6 Advanced Analytics Charts

**Purpose:** Beyond daily totals (Feature 1.4), owners and admins want interactive charts: cumulative progress curve, contributor growth over time, payment method breakdown (M-Pesa vs. card), and hour-of-day heatmap.

**User story:** As a power user running large collections, I want interactive charts of my collection data so I can identify peak contribution times and optimize my outreach.

**Frontend:**
- Install `recharts` or `chart.js` (Recharts is better for React/Next.js)
- `client/app/dashboard/collections/[id]/page.tsx` — analytics tab with multiple chart types
- `client/app/admin/page.tsx` — platform-wide analytics for admin

**Backend:**
- `GET /api/collections/:id/summary` — extend with hourly data, payment method breakdown
- `GET /api/admin/summary` — extend with platform-wide trend data
- All aggregation queries on existing data — no model changes

**Risk:** Low — read-only aggregation. No write path.

**Priority:** Low — useful at scale, not needed for early users.

**Touches payment logic:** No.

---

## Implementation Order Recommendation

### Safest First Feature: **1.6 + 1.7 — Share Buttons + Thank-You Message**

Implement these two together as one small PR:

**Why this pair:**

1. **Zero backend risk** — Feature 1.6 (share buttons) is 100% frontend with no API calls. Feature 1.7 (thank-you message) uses a field (`thankYouMessage`) that already exists in the Project model and is already accepted by the existing `PATCH /api/collections/:id` endpoint. No new routes, no schema migration.

2. **Zero payment logic risk** — Neither feature touches Snippe checkout, webhook handler, session creation, verify path, or stats aggregation.

3. **High user value** — WhatsApp sharing is how Tanzania distributes payment links. A personal thank-you message is the cheapest possible way to improve contributor experience.

4. **Fast to build** — Share buttons: ~50 lines of JSX. Thank-you field: one `textarea` added to `CollectionForm.tsx` and one conditional `<p>` on the return page. A single focused PR.

5. **Good branch warm-up** — A low-risk first PR on `feature-roadmap` establishes the branch workflow and confirms the CI/deploy pipeline works before touching anything sensitive.

**Second feature (after share + thank-you):** Feature **1.1 — Edit Collection Details**, because the PATCH endpoint and CollectionForm already exist — it is mostly wiring the form into an edit mode with pre-populated values.

---

## Branch and Merge Policy

- All feature work happens on `feature-roadmap` or sub-branches cut from it.
- Never merge directly to `main` without a passing build and a manual smoke test of the payment flow.
- `v1.0.0-mvp` tag on `main` is the safe restore point. If a feature branch causes a regression, `git checkout v1.0.0-mvp` recovers the working state.
- Features that touch payment logic (marked **Yes** above) require an end-to-end payment test before merge: create session → Snippe checkout → payment → verify stats.
- Features that do NOT touch payment logic can be merged after a UI smoke test and a passing `npm run build`.

---

## Risk Summary Table

| # | Feature | Risk | Touches Payment Logic |
|---|---|---|---|
| 1.1 | Edit collection details | Low | No |
| 1.2 | Pause / close / reactivate | Medium | Yes (session creation guard) |
| 1.3 | Payment filtering | Low | No |
| 1.4 | Collection analytics | Low | No |
| 1.5 | Receipt download | Low | No |
| 1.6 | Share buttons | **Low** | **No** |
| 1.7 | Thank-you message | **Low** | **No** |
| 1.8 | Pending/failed visibility | Low | No |
| 2.1 | Public page preview | Low | No |
| 2.2 | Owner display name | Low | No |
| 2.3 | Category badges | Low | No |
| 2.4 | Report / flag | Low | No |
| 2.5 | Contact page | Low | No |
| 2.6 | Notification stubs | Medium | No (post-save hook only) |
| 2.7 | Admin monitoring | Low–Medium | No |
| 3.1 | QR codes | Low | No |
| 3.2 | WhatsApp message generator | Low | No |
| 3.3 | Contributor list toggle | Low | No |
| 3.4 | Custom branding | Medium | No |
| 3.5 | Multiple currencies | Medium | **Yes** |
| 3.6 | Collection templates | Low | No |
| 4.1 | Team members | High | No (auth refactor) |
| 4.2 | Withdrawal tracking | Low–Medium | No |
| 4.3 | Recurring contributions | High | **Yes** |
| 4.4 | Email receipts | Medium | No (post-save try/catch) |
| 4.5 | PDF reports | Low | No |
| 4.6 | Advanced analytics | Low | No |
