# SarafuPay — Lipa kwa urahisi

SarafuPay is a full-stack payment collection platform for Tanzania. Create a public collection page for any event, project, or group — share the link and accept M-Pesa or card payments through Snippe. Every payment is webhook-verified and tracked in a clean owner dashboard.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Zustand, React Hook Form, Zod, Sonner, Recharts |
| Backend | Express 5, TypeScript, MongoDB, Mongoose, JWT HTTP-only cookies, bcrypt, Helmet, CORS, rate limiting, compression, Morgan |
| Payments | Snippe Payment Sessions + Snippe webhooks |

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the server

```bash
cd server
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
```

Fill in `server/.env`:

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/sarafupay` for local |
| `JWT_SECRET` | Yes | At least 32 random characters |
| `CLIENT_URL` | Yes | `http://localhost:3000` |
| `SERVER_URL` | Yes | Your ngrok HTTPS URL for local webhook testing |
| `SNIPPE_API_KEY` | Yes | From Snippe dashboard |
| `SNIPPE_WEBHOOK_SECRET` | Yes (production) | From Snippe dashboard — leave empty for local |
| `SNIPPE_BASE_URL` | No | Default: `https://api.snippe.sh` |
| `SNIPPE_PROFILE_ID` | No | Sets SarafuPay branding on Snippe checkout |

### 3. Configure the client

```bash
cd client
copy .env.example .env.local   # Windows
cp .env.example .env.local     # Mac/Linux
```

`client/.env.local` only needs one variable for local dev:

```env
NEXT_PUBLIC_API_PROXY_URL=http://127.0.0.1:5000
```

The Next.js rewrite proxies all `/api/*` calls from the browser through the Next.js server to the Express backend — no CORS issues, cookies stay same-host.

### 4. Start MongoDB

Make sure MongoDB is running locally on port 27017.

### 5. Run the dev servers

Terminal 1 — backend:

```bash
npm --workspace server run dev
```

Terminal 2 — frontend:

```bash
npm --workspace client run dev
```

Open `http://localhost:3000`.

### 6. Seed the admin user (optional)

```bash
npm run seed
```

Creates one admin user and a sample active project. Credentials are set via `ADMIN_*` variables in `server/.env`.

## Payment Flow

1. User opens a public collection page (`/pay/[slug]`) — no login needed.
2. They enter their name, phone, and optional email, then click Pay.
3. Backend creates a pending payment record and a Snippe payment session.
4. User is redirected to Snippe's hosted checkout and pays via M-Pesa or card.
5. Snippe sends a signed webhook to `/api/webhooks/snippe` — the backend verifies the signature and marks the payment completed.
6. If the user returns to `/payment/return`, the return page also calls the Snippe API directly to confirm status.
7. Project `totalCollected` and `contributorCount` update automatically.

The redirect URL is never trusted as payment confirmation — the webhook is the source of truth.

## Snippe Webhook Testing Locally

```bash
ngrok http 5000
```

Set `SERVER_URL` in `server/.env` to the HTTPS ngrok URL. Register the webhook in the Snippe dashboard:

```text
https://your-ngrok-url.ngrok-free.app/api/webhooks/snippe
```

Subscribe to: `payment.completed`, `payment.failed`, `payment.expired`, `payment.cancelled`.

## Build

```bash
npm run build          # builds server (tsc) + client (next build)
npm --workspace server run build
npm --workspace client run build
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide.

**Recommended stack:** Vercel (frontend) + DigitalOcean App Platform (backend) + MongoDB Atlas (database).

**Production launch is blocked until `SNIPPE_WEBHOOK_SECRET` is set and the webhook path is tested end-to-end.** See [FINAL_TEST_REPORT.md](./FINAL_TEST_REPORT.md).

## Testing

See [TESTING.md](./TESTING.md) for the full manual test guide and [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md) for a fast pre-session checklist.
