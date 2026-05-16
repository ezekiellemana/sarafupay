import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./config/env";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { sanitizeRequest } from "./middleware/sanitize.middleware";
import { globalApiLimiter } from "./middleware/rateLimit.middleware";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import collectionRoutes from "./routes/collection.routes";
import paymentRoutes from "./routes/payment.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
import webhookRoutes from "./routes/webhook.routes";

export const app = express();
const allowedOrigins = new Set([
  env.CLIENT_URL,
  ...(isProduction ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"])
]);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(cookieParser());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SarafuPay API is healthy.", data: { service: "sarafupay-api" } });
});

// Global rate limiter covers all /api/* routes not already covered by specific limiters.
// /health is not under /api/ so it is excluded automatically.
// Webhook routes are skipped inside globalApiLimiter (they have their own limiter).
app.use("/api", globalApiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use(notFound);
app.use(errorHandler);
