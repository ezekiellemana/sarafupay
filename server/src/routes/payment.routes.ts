import { Router } from "express";
import {
  createPaymentSchema,
  createPublicSession,
  createSession,
  getPayment,
  listPaymentQuerySchema,
  myPayments,
  mySummary,
  publicPaymentSchema,
  retryPayment,
  verifyPayment
} from "../controllers/payment.controller";
import { protect } from "../middleware/auth.middleware";
import { paymentLimiter, publicPaymentLimiter } from "../middleware/rateLimit.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// Public route — no auth required
router.post("/create-public-session", publicPaymentLimiter, validate(publicPaymentSchema), createPublicSession);

// Protected routes
router.post("/create-session", protect, paymentLimiter, validate(createPaymentSchema), createSession);
router.get("/my-payments", protect, validate(listPaymentQuerySchema, "query"), myPayments);
router.get("/my-summary", protect, mySummary);
router.get("/verify/:reference", verifyPayment);
router.post("/retry/:paymentId", protect, paymentLimiter, retryPayment);
router.get("/:id", protect, getPayment);

export default router;
