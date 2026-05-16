import rateLimit from "express-rate-limit";

// Global fallback: catches all /api/* routes that have no specific limiter.
// Mounted at "/api" in app.ts, so req.path is relative (e.g. "/webhooks/snippe").
// Webhook routes are skipped here because they have their own limiter below.
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/webhooks"),
  message: { success: false, message: "Too many requests. Please try again later.", errorCode: "RATE_LIMITED" }
});

// Webhook-specific: Snippe retries up to ~10 times on failures; 60/5 min is
// well above that while still blocking a sustained unauthenticated flood.
export const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many webhook requests.", errorCode: "RATE_LIMITED" }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Try again soon.", errorCode: "RATE_LIMITED" }
});

export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests. Try again soon.", errorCode: "RATE_LIMITED" }
});

export const publicPaymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests. Try again in a few minutes.", errorCode: "RATE_LIMITED" }
});

export const publicCollectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Slow down.", errorCode: "RATE_LIMITED" }
});
