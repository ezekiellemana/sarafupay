import { z } from "zod";
import { Payment } from "../models/Payment.model";
import { asyncHandler } from "../utils/asyncHandler";
import { createContributionPayment, createPublicPayment, getUserPayments, verifyLocalPayment } from "../services/payment.service";
import { getMemberDashboard } from "../services/dashboard.service";

export const createPaymentSchema = z.object({
  projectId: z.string().optional(),
  monthPaidFor: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

export const listPaymentQuerySchema = z.object({
  status: z.enum(["pending", "completed", "failed", "expired", "cancelled"]).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  search: z.string().optional()
});

export const publicPaymentSchema = z.object({
  collectionSlug: z.string().min(1),
  payerName: z.string().min(2, "Full name is required.").max(120),
  payerPhone: z.string().min(6, "Phone number is required.").max(20),
  payerEmail: z.string().email("Use a valid email.").optional().or(z.literal("")),
  amount: z.coerce.number().min(1, "Amount must be at least 1."),
  payerMessage: z.string().max(300).optional()
});

export const createSession = asyncHandler(async (req, res) => {
  const result = await createContributionPayment(req.user!, req.body.projectId, req.body.monthPaidFor);
  res.status(201).json({
    success: true,
    message: "Snippe checkout session created.",
    data: {
      payment: result.payment,
      project: result.project,
      checkout_url: result.checkoutUrl,
      payment_url: result.paymentUrl
    }
  });
});

export const createPublicSession = asyncHandler(async (req, res) => {
  const result = await createPublicPayment(req.body);
  res.status(201).json({
    success: true,
    message: "Payment session created. Redirecting to checkout.",
    data: { checkout_url: result.checkoutUrl, payment: { externalReference: result.payment.externalReference } }
  });
});

export const myPayments = asyncHandler(async (req, res) => {
  const query = req.query as z.infer<typeof listPaymentQuerySchema>;
  const payments = await getUserPayments(req.user!._id, query);
  res.json({ success: true, message: "Payments loaded.", data: { payments } });
});

export const mySummary = asyncHandler(async (req, res) => {
  const summary = await getMemberDashboard(req.user!._id);
  res.json({ success: true, message: "Payment summary loaded.", data: summary });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, userId: req.user!._id }).populate("projectId", "title");
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found.", errorCode: "PAYMENT_NOT_FOUND" });
  res.json({ success: true, message: "Payment loaded.", data: { payment } });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await verifyLocalPayment(String(req.params.reference));

  // Return only safe public receipt fields. Sensitive PII (phone, email, message,
  // raw webhook payload, internal IDs) is not exposed on this unauthenticated endpoint.
  const publicPayment = {
    _id: payment._id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    customerName: payment.customerName,
    externalReference: payment.externalReference,
    snippeReference: payment.snippeReference,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    projectId: payment.projectId // already populated with { title, description, thankYouMessage }
  };

  res.json({
    success: true,
    message: "Payment status loaded.",
    data: {
      status: payment.status,
      reference: payment.snippeReference ?? payment.externalReference,
      payment: publicPayment
    }
  });
});

export const retryPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, userId: req.user!._id });
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found.", errorCode: "PAYMENT_NOT_FOUND" });
  const result = await createContributionPayment(req.user!, payment.projectId.toString(), payment.monthPaidFor);
  res.status(201).json({ success: true, message: "Retry checkout session created.", data: result });
});
