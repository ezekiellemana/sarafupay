import crypto from "crypto";
import type { Types } from "mongoose";
import { Payment, type PaymentStatus } from "../models/Payment.model";
import { Project } from "../models/Project.model";
import type { IUser } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { getCurrentMonth } from "../utils/dateHelpers";
import { createPaymentSession, normalizeSnippeWebhookEvent, verifyPayment as verifySnippePayment } from "./snippe.service";
import { notifyPaymentStatusChanged } from "./notification.service";
import { refreshCollectionStats } from "./collection.service";

const finalStatuses: PaymentStatus[] = ["completed", "failed", "expired", "cancelled"];

export const generateExternalReference = (prefix: string, suffix: string) =>
  `SPY-${prefix.replace("-", "")}-${suffix.slice(-6).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

export const createContributionPayment = async (user: IUser, projectId?: string, monthPaidFor = getCurrentMonth()) => {
  const project = projectId ? await Project.findById(projectId) : await Project.findOne({ status: "active" }).sort({ createdAt: 1 });
  if (!project || project.status !== "active") throw new AppError("No active contribution project found.", 404, "PROJECT_NOT_FOUND");

  const duplicate = await Payment.findOne({ userId: user._id, projectId: project._id, monthPaidFor, status: "completed" });
  if (duplicate) throw new AppError("You already paid for this month.", 409, "MONTH_ALREADY_PAID");

  const externalReference = generateExternalReference(monthPaidFor, user._id.toString());
  const amount = project.suggestedAmount ?? project.monthlyContributionAmount;
  const payment = await Payment.create({
    ownerId: project.ownerId ?? project.createdBy,
    userId: user._id,
    projectId: project._id,
    amount,
    currency: project.currency,
    status: "pending",
    externalReference,
    customerName: user.fullName,
    customerPhone: user.phoneNumber,
    customerEmail: user.email,
    monthPaidFor,
    metadata: {
      appName: "SarafuPay",
      userId: user._id.toString(),
      projectId: project._id.toString(),
      monthPaidFor,
      externalReference,
      purpose: project.collectionType ?? "monthly_contribution"
    }
  });

  try {
    const session = await createPaymentSession({
      amount: payment.amount,
      currency: payment.currency,
      description: `${project.title} - ${monthPaidFor}`,
      lineItemName: project.title,
      externalReference,
      allowCustomAmount: false,
      customer: { name: user.fullName, phone: user.phoneNumber, email: user.email },
      metadata: payment.metadata as Record<string, string>
    });
    payment.snippeReference = session.reference;
    payment.snippeSessionId = session.id ?? session.reference;
    payment.snippeCheckoutUrl = session.checkoutUrl;
    payment.snippePaymentLinkUrl = session.paymentLinkUrl;
    await payment.save();
    return { payment, project, checkoutUrl: session.checkoutUrl, paymentUrl: session.paymentLinkUrl ?? session.checkoutUrl };
  } catch (error) {
    await Payment.deleteOne({ _id: payment._id });
    throw error;
  }
};

export type PublicPaymentInput = {
  collectionSlug: string;
  payerName: string;
  payerPhone: string;
  payerEmail?: string;
  amount: number;
  payerMessage?: string;
};

export const createPublicPayment = async (input: PublicPaymentInput) => {
  const project = await Project.findOne({ slug: input.collectionSlug, visibility: "public", status: { $in: ["active", "paused"] } });
  if (!project) throw new AppError("Collection not found or not accepting payments.", 404, "COLLECTION_NOT_FOUND");
  if (project.status === "paused") throw new AppError("This collection is temporarily paused.", 400, "COLLECTION_PAUSED");

  const effectiveAmount = project.allowCustomAmount ? input.amount : (project.suggestedAmount ?? project.monthlyContributionAmount);
  if (!effectiveAmount || effectiveAmount < 1) throw new AppError("Invalid payment amount.", 400, "INVALID_AMOUNT");
  if (project.minimumAmount && effectiveAmount < project.minimumAmount)
    throw new AppError(`Minimum contribution is ${project.minimumAmount} ${project.currency}.`, 400, "AMOUNT_TOO_LOW");

  const month = getCurrentMonth();
  const externalReference = generateExternalReference(month, `${Date.now()}`);

  const payment = await Payment.create({
    ownerId: project.ownerId ?? project.createdBy,
    projectId: project._id,
    amount: effectiveAmount,
    currency: project.currency,
    status: "pending",
    externalReference,
    customerName: input.payerName,
    customerPhone: input.payerPhone,
    customerEmail: input.payerEmail,
    payerMessage: input.payerMessage,
    monthPaidFor: month,
    metadata: {
      appName: "SarafuPay",
      collectionSlug: input.collectionSlug,
      projectId: project._id.toString(),
      externalReference,
      purpose: project.collectionType ?? "custom",
      payerName: input.payerName,
      payerPhone: input.payerPhone
    }
  });

  try {
    const session = await createPaymentSession({
      amount: payment.amount,
      currency: payment.currency,
      description: project.paymentPurpose ?? project.title,
      lineItemName: project.title,
      externalReference,
      allowCustomAmount: project.allowCustomAmount,
      customer: { name: input.payerName, phone: input.payerPhone, email: input.payerEmail },
      metadata: payment.metadata as Record<string, string>
    });
    payment.snippeReference = session.reference;
    payment.snippeSessionId = session.id ?? session.reference;
    payment.snippeCheckoutUrl = session.checkoutUrl;
    payment.snippePaymentLinkUrl = session.paymentLinkUrl;
    await payment.save();
    return { payment, project, checkoutUrl: session.checkoutUrl };
  } catch (error) {
    await Payment.deleteOne({ _id: payment._id });
    throw error;
  }
};

export const verifyLocalPayment = async (reference: string) => {
  const payment = await Payment.findOne({
    $or: [{ snippeReference: reference }, { snippeSessionId: reference }, { externalReference: reference }]
  }).populate("projectId", "title description thankYouMessage");
  if (!payment) throw new AppError("Payment reference not found.", 404, "PAYMENT_NOT_FOUND");

  if (payment.status === "pending") {
    try {
      const snippe = await verifySnippePayment(payment.snippeReference ?? payment.snippeSessionId ?? reference);
      if (finalStatuses.includes(snippe.status as PaymentStatus)) {
        payment.status = snippe.status === "cancelled" ? "cancelled" : (snippe.status as PaymentStatus);
        if (payment.status === "completed") payment.paidAt = new Date();
        await payment.save();
        const rawProjectId = ((payment.projectId as unknown as { _id: Types.ObjectId })?._id) ?? (payment.projectId as unknown as Types.ObjectId);
        await refreshCollectionStats(rawProjectId);
      }
    } catch {
      // Silently keep pending state if Snippe is unreachable.
    }
  }

  return payment;
};

export const handleSnippeWebhook = async (payload: unknown) => {
  const event = normalizeSnippeWebhookEvent(payload);
  const data = event.data;
  const referenceCandidates = [
    data.reference,
    data.session_reference,
    data.external_reference,
    data.metadata?.externalReference as string | undefined
  ].filter(Boolean);

  const payment = await Payment.findOne({
    $or: [
      { snippeReference: { $in: referenceCandidates } },
      { snippeSessionId: { $in: referenceCandidates } },
      { externalReference: { $in: referenceCandidates } }
    ]
  });

  if (!payment) throw new AppError("Payment not found for webhook.", 404, "WEBHOOK_PAYMENT_NOT_FOUND");
  if (payment.status === "completed") return payment;

  const eventStatus = mapWebhookEventToStatus(event.type, data.status);
  payment.status = eventStatus;
  payment.snippeReference = data.reference ?? payment.snippeReference;
  payment.snippeSessionId = data.session_reference ?? payment.snippeSessionId;
  payment.paymentMethod = data.payment_method ?? data.payment_channel ?? payment.paymentMethod;
  payment.customerName = data.customer?.name ?? payment.customerName;
  payment.customerPhone = data.customer?.phone ?? payment.customerPhone;
  payment.customerEmail = data.customer?.email ?? payment.customerEmail;
  payment.rawWebhookPayload = payload as Record<string, unknown>;

  if (eventStatus === "completed") {
    payment.paidAt = data.completed_at ? new Date(data.completed_at) : new Date();
  }

  await payment.save();

  if (eventStatus === "completed") {
    await refreshCollectionStats(payment.projectId);
  }

  await notifyPaymentStatusChanged();
  return payment;
};

const mapWebhookEventToStatus = (eventType: string, status?: string): PaymentStatus => {
  if (eventType === "payment.completed" || status === "completed") return "completed";
  if (eventType === "payment.failed" || status === "failed") return "failed";
  if (eventType === "payment.expired" || status === "expired") return "expired";
  if (eventType === "payment.cancelled" || eventType === "payment.voided" || status === "cancelled") return "cancelled";
  return "pending";
};

export const getUserPayments = (userId: Types.ObjectId, filters: { status?: PaymentStatus; month?: string; search?: string }) => {
  const query: Record<string, unknown> = { userId };
  if (filters.status) query.status = filters.status;
  if (filters.month) query.monthPaidFor = filters.month;
  if (filters.search) {
    query.$or = [
      { externalReference: new RegExp(filters.search, "i") },
      { snippeReference: new RegExp(filters.search, "i") }
    ];
  }
  return Payment.find(query).populate("projectId", "title").sort({ createdAt: -1 });
};
