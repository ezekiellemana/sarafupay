import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  SERVER_URL: z.string().url().default("http://localhost:5000"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters."),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("sarafupay_token"),
  SNIPPE_API_KEY: z.string().optional(),
  SNIPPE_WEBHOOK_SECRET: z.string().optional(),
  SNIPPE_BASE_URL: z.string().url().optional(),
  SNIPPE_PROFILE_ID: z.string().optional(),
  ADMIN_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PHONE: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  // Reserved for future fee integration (Phase F3D). When absent or "false",
  // payment creation behaves exactly as it does today — no fees are applied.
  FEES_ENABLED: z.string().optional().transform((v) => v === "true"),
  // Email notifications via Resend. All three are optional — server starts
  // normally without them; notifications are silently skipped.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional()
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  SERVER_URL: process.env.SERVER_URL,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  COOKIE_NAME: process.env.COOKIE_NAME,
  SNIPPE_API_KEY: process.env.SNIPPE_API_KEY,
  SNIPPE_WEBHOOK_SECRET: process.env.SNIPPE_WEBHOOK_SECRET,
  SNIPPE_BASE_URL: process.env.SNIPPE_BASE_URL,
  SNIPPE_PROFILE_ID: process.env.SNIPPE_PROFILE_ID,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PHONE: process.env.ADMIN_PHONE,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  FEES_ENABLED: process.env.FEES_ENABLED,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
});

export const isProduction = env.NODE_ENV === "production";

// Fail fast in production if payment gateway secrets are missing.
// Keeps local development flexible (Snippe not required to run the app locally).
if (isProduction) {
  const missing: string[] = [];
  if (!env.SNIPPE_API_KEY) missing.push("SNIPPE_API_KEY");
  if (!env.SNIPPE_WEBHOOK_SECRET) missing.push("SNIPPE_WEBHOOK_SECRET");
  if (!env.SNIPPE_BASE_URL) missing.push("SNIPPE_BASE_URL");
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required production environment variable(s): ${missing.join(", ")}. ` +
      "Server cannot start without payment gateway credentials."
    );
  }
  if (!env.RESEND_API_KEY) {
    console.warn("[env] RESEND_API_KEY not set — email notifications disabled in production.");
  }
}
