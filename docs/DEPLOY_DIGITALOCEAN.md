# Deploying sarafupay.app on DigitalOcean

This puts the new SarafuPay (branch `v2`) live on DigitalOcean App Platform, first on its own
`*.ondigitalocean.app` address, then on `sarafupay.app`. Do every step yourself in the
dashboards; never paste keys into chat or commit them.

Takes about 30 minutes, plus DNS time.

## 1. Create the app (5 min)

1. DigitalOcean → **Create** → **Apps**.
2. Choose **GitHub**, authorise if asked, pick `ezekiellemana/sarafupay`, branch **v2**.
3. On the next screen choose **Edit app spec** (or "Import from app spec") and replace the
   content with `.do/app.yaml` from the repo.
4. Region: **Frankfurt**. Click **Next** until the review page.
5. Plan: the spec uses one `apps-s-1vcpu-1gb` web instance, a 0.5 GB scheduled job and a
   dev Postgres database. Check the monthly total DigitalOcean shows before you continue.
6. **Create resources**. The first build fails health checks until secrets are added; that's fine.

## 2. Add the secrets (10 min)

App → **Settings** → **web** component → **Environment Variables** → **Edit**. For each key,
paste the value and tick **Encrypt**:

| Key | Where to get it |
|---|---|
| `SNIPPE_API_KEY` | Snippe dashboard → Developers / API keys (`snp_…`) |
| `SNIPPE_WEBHOOK_SECRET` | Snippe dashboard → Settings → Webhook Secret (`whsec_…`) |
| `SNIPPE_PROFILE_ID` | Optional: Snippe payment profile for checkout branding |
| `PAYPAL_ENV` | `sandbox` while testing, `live` for real money |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | developer.paypal.com → Apps & Credentials → **Live** (or Sandbox) app |
| `PAYPAL_WEBHOOK_ID` | Step 4 below |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `WHATSAPP_*` | See step 5 |
| `ADMIN_KEY` | Make one up: 32+ random characters. Your admin page is `/admin?key=<ADMIN_KEY>` |

Then App → **Settings** → **App-Level Environment Variables**: set `CRON_SECRET` to another
long random string (Encrypt). The reconcile job and the web service share it.

Save. DigitalOcean redeploys. Open `https://<your-app>.ondigitalocean.app/api/health`:
you want `"ok": true`, `"snippe": true` and `"paypal": "sandbox"` (or `"live"`).

## 3. Snippe webhook (2 min)

Every payment and payout already tells Snippe where to send its webhook
(`<APP_URL>/api/snippe/webhook`), so nothing else is required. If the Snippe dashboard also has
a default webhook URL, set it to the same address.

## 4. PayPal webhook (5 min)

developer.paypal.com → your app → **Add Webhook**:

- URL: `https://<your-app>.ondigitalocean.app/api/paypal/webhook` (change it to
  `https://sarafupay.app/api/paypal/webhook` after step 7)
- Events: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, all
  `PAYMENT.PAYOUTS-ITEM.*`, `PAYMENT.PAYOUTSBATCH.SUCCESS`, `INVOICING.INVOICE.PAID`

Copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID`.

PayPal Payouts must be enabled on a live account before payouts to PayPal work. If a payout says
"not authorised", ask PayPal support to enable Payouts.

## 5. WhatsApp (decide first)

The current bot number (+255 650 972 587) points at **sarafupay-ai.onrender.com**, the PayPal
AI Hackathon entry, which is judged until about 15 December. Pointing that number's webhook at the
new app would change what the judges see. Two options:

- **Keep the number on the hackathon app until judging ends**, and launch sarafupay.app with
  the web pages and `/chat` first. Move the webhook after judging.
- **Add a second number** to the WhatsApp Business Account for sarafupay.app now.

Whichever number the new app uses: Meta app → WhatsApp → Configuration → Webhook URL
`<APP_URL>/api/whatsapp`, verify token = your `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages`.
The `pledge_reminder` template's button links to `sarafupay-ai.onrender.com/pay/{{1}}`; create a
new template version with `https://sarafupay.app/pay/{{1}}` for the new app.

## 6. Test on the ondigitalocean.app address (10 min)

1. `/pricing` shows the right prices.
2. `/admin?key=<ADMIN_KEY>` opens; rates match the agreed table.
3. `/chat`: create a collection as Organiser, pay **TZS 10,000** with your own M-Pesa through the
   link. The thank-you page should turn to "Asante sana!" and the organiser gets the alert. The
   collection balance should show TZS 9,500 (5% fees).
4. Withdraw TZS 5,000 to your own number and reply with the CONFIRM code. You should receive
   TZS 3,375 (TZS 1,500 Snippe + TZS 125 SarafuPay). Payouts smaller than the fees are refused.
5. `/admin` shows the payment, the payout and SarafuPay's earnings.

## 7. Move sarafupay.app to the new app

1. App → **Settings** → **Domains** → **Add Domain** → `sarafupay.app` (and `www.sarafupay.app`).
2. If the domain's DNS is on DigitalOcean, choose "We manage your domain" and it's automatic.
   Otherwise add the CNAME/ALIAS records DigitalOcean shows at your registrar.
3. Wait for the certificate (status **Active**). Then `APP_URL` automatically becomes
   `https://sarafupay.app`; update the PayPal webhook URL (step 4).

## 8. Retire the old app

Only after step 7 works:

1. Delete the old DigitalOcean app(s) for the Express backend and remove its MongoDB.
2. Replace `main` in GitHub with `v2` (Claude does this on request), then in the app spec change
   both `branch: v2` lines to `branch: main`.
3. Delete the old local folder `D:\PROJECTS\sarafupay` and clone fresh.
