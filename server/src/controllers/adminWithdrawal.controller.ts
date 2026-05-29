import { z } from "zod";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { validate } from "../middleware/validate.middleware";
import {
  adminListWithdrawals,
  adminGetWithdrawal,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  adminMarkProcessing,
  adminMarkPaid,
  adminMarkFailed,
} from "../services/withdrawal.service";
import { User } from "../models/User.model";
import { Project } from "../models/Project.model";
import { sendWithdrawalStatusOwnerEmail } from "../services/email.service";
import type { WithdrawalDocument } from "../models/Withdrawal.model";

function maskPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `****${digits.slice(-4)}`;
}

function maskBankAccount(account: string | undefined): string | undefined {
  if (!account) return undefined;
  if (account.length <= 4) return "****";
  return `****${account.slice(-4)}`;
}

function parseObjectId(raw: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(raw)) {
    throw new AppError(`Invalid ${label}.`, 400, "INVALID_ID");
  }
  return new mongoose.Types.ObjectId(raw);
}

// ─── Email helper ─────────────────────────────────────────────────────────────

function fireStatusEmail(w: WithdrawalDocument, status: string): void {
  const wObj = w.toObject();
  Promise.all([
    User.findById(w.ownerId).select("email fullName").lean(),
    Project.findById(w.projectId).select("title slug").lean(),
  ])
    .then(([owner, project]) => {
      if (!owner?.email) return;
      return sendWithdrawalStatusOwnerEmail({
        withdrawal: wObj,
        ownerEmail: owner.email,
        ownerName: owner.fullName ?? "",
        collectionTitle: project?.title ?? "your collection",
        collectionSlug: project?.slug ?? "",
        status,
      });
    })
    .catch((err: Error) =>
      console.error(`[email] Status notification failed for withdrawal ${w._id} (${status}):`, err.message)
    );
}

// ─── List ────────────────────────────────────────────────────────────────────

export const listAdminWithdrawalsHandler = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(String(req.query["page"]  ?? "1"),  10) || 1);
  const limit = Math.min(50, parseInt(String(req.query["limit"] ?? "20"), 10) || 20);

  const result = await adminListWithdrawals({
    status:   req.query["status"]   ? String(req.query["status"])   : undefined,
    search:   req.query["search"]   ? String(req.query["search"])   : undefined,
    dateFrom: req.query["dateFrom"] ? String(req.query["dateFrom"]) : undefined,
    dateTo:   req.query["dateTo"]   ? String(req.query["dateTo"])   : undefined,
    page,
    limit,
  });

  type PopulatedOwner = { _id: { toString(): string }; fullName?: string; email?: string } | null;
  type PopulatedProject = { _id: { toString(): string }; title?: string; slug?: string } | null;

  const safeList = result.withdrawals.map((w) => {
    const owner   = w.ownerId   as unknown as PopulatedOwner;
    const project = w.projectId as unknown as PopulatedProject;
    return {
      id:            (w._id as mongoose.Types.ObjectId).toString(),
      status:        w.status,
      requestedAmount: w.requestedAmount,
      withdrawalFee:   w.withdrawalFee,
      totalDeducted:   w.totalDeducted,
      ownerReceives:   w.ownerReceives,
      currency:        w.currency,
      destinationType: w.destinationType,
      ownerName:        owner?.fullName   ?? "—",
      ownerEmail:       owner?.email      ?? "—",
      collectionTitle:  project?.title    ?? "—",
      collectionSlug:   project?.slug,
      maskedRecipientPhone:    w.destinationType === "mobile_money" ? maskPhone(w.recipientPhone) : undefined,
      maskedBankAccountNumber: w.destinationType === "bank"         ? maskBankAccount(w.bankAccountNumber) : undefined,
      requestedAt:  w.requestedAt,
      approvedAt:   w.approvedAt,
      processingAt: w.processingAt,
      paidAt:       w.paidAt,
      rejectedAt:   w.rejectedAt,
      failedAt:     w.failedAt,
      cancelledAt:  w.cancelledAt,
    };
  });

  res.json({
    success: true,
    message: "Withdrawals loaded.",
    data: {
      withdrawals: safeList,
      total:       result.total,
      page:        result.page,
      totalPages:  result.totalPages,
      summary:     result.summary,
    },
  });
});

// ─── Detail ──────────────────────────────────────────────────────────────────

export const getAdminWithdrawalHandler = asyncHandler(async (req, res) => {
  const withdrawalId = parseObjectId(req.params["id"] as string, "withdrawal id");
  const { withdrawal, liveBalance } = await adminGetWithdrawal(withdrawalId);

  type PUser    = { _id: { toString(): string }; fullName?: string; email?: string; phoneNumber?: string } | null;
  type PProject = { _id: { toString(): string }; title?: string; slug?: string; currency?: string } | null;
  type PAdmin   = { _id: { toString(): string }; fullName?: string } | null;

  const owner   = withdrawal.ownerId   as unknown as PUser;
  const project = withdrawal.projectId as unknown as PProject;
  const approvedByUser = withdrawal.approvedBy as unknown as PAdmin;
  const rejectedByUser = withdrawal.rejectedBy as unknown as PAdmin;
  const paidByUser     = withdrawal.paidBy     as unknown as PAdmin;

  res.json({
    success: true,
    message: "Withdrawal detail loaded.",
    data: {
      id:            (withdrawal._id as mongoose.Types.ObjectId).toString(),
      status:        withdrawal.status,
      requestedAmount: withdrawal.requestedAmount,
      withdrawalFee:   withdrawal.withdrawalFee,
      providerFee:     withdrawal.providerFee,
      totalDeducted:   withdrawal.totalDeducted,
      ownerReceives:   withdrawal.ownerReceives,
      currency:        withdrawal.currency,
      destinationType: withdrawal.destinationType,
      recipientName:   withdrawal.recipientName,
      recipientPhone:  withdrawal.recipientPhone,
      bankName:        withdrawal.bankName,
      bankAccountNumber: withdrawal.bankAccountNumber,
      ownerNote:       withdrawal.ownerNote,
      adminNote:       withdrawal.adminNote,
      rejectionReason: withdrawal.rejectionReason,
      payoutReference: withdrawal.payoutReference,
      owner: {
        id:          owner?._id?.toString() ?? "",
        fullName:    owner?.fullName         ?? "—",
        email:       owner?.email            ?? "—",
        phoneNumber: owner?.phoneNumber,
      },
      collection: {
        id:    project?._id?.toString() ?? "",
        title: project?.title           ?? "—",
        slug:  project?.slug,
      },
      balanceSnapshot: withdrawal.balanceSnapshot,
      liveBalance,
      approvedBy:  approvedByUser?.fullName,
      rejectedBy:  rejectedByUser?.fullName,
      paidBy:      paidByUser?.fullName,
      requestedAt:  withdrawal.requestedAt,
      approvedAt:   withdrawal.approvedAt,
      processingAt: withdrawal.processingAt,
      paidAt:       withdrawal.paidAt,
      rejectedAt:   withdrawal.rejectedAt,
      failedAt:     withdrawal.failedAt,
      cancelledAt:  withdrawal.cancelledAt,
    },
  });
});

// ─── Approve ─────────────────────────────────────────────────────────────────

export const approveWithdrawalSchema = z.object({
  adminNote: z.string().max(1000).optional(),
});

export const approveWithdrawalHandler = [
  validate(approveWithdrawalSchema),
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params["id"] as string, "withdrawal id");
    const w = await adminApproveWithdrawal(req.user!._id, id, req.body.adminNote);
    res.json({ success: true, message: "Withdrawal approved.", data: { status: w.status } });
    fireStatusEmail(w, "approved");
  }),
];

// ─── Reject ──────────────────────────────────────────────────────────────────

export const rejectWithdrawalSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required.").max(1000),
});

export const rejectWithdrawalHandler = [
  validate(rejectWithdrawalSchema),
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params["id"] as string, "withdrawal id");
    const w = await adminRejectWithdrawal(req.user!._id, id, req.body.rejectionReason);
    res.json({ success: true, message: "Withdrawal rejected.", data: { status: w.status } });
    fireStatusEmail(w, "rejected");
  }),
];

// ─── Mark Processing ─────────────────────────────────────────────────────────

export const markProcessingHandler = asyncHandler(async (req, res) => {
  const id = parseObjectId(req.params["id"] as string, "withdrawal id");
  const w = await adminMarkProcessing(id);
  res.json({ success: true, message: "Withdrawal marked as processing.", data: { status: w.status } });
  fireStatusEmail(w, "processing");
});

// ─── Mark Paid ───────────────────────────────────────────────────────────────

export const markPaidSchema = z.object({
  payoutReference: z.string().min(1, "payoutReference is required."),
  adminNote: z.string().max(1000).optional(),
});

export const markPaidHandler = [
  validate(markPaidSchema),
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params["id"] as string, "withdrawal id");
    const w = await adminMarkPaid(req.user!._id, id, req.body.payoutReference, req.body.adminNote);
    res.json({ success: true, message: "Withdrawal marked as paid.", data: { status: w.status } });
    fireStatusEmail(w, "paid");
  }),
];

// ─── Mark Failed ─────────────────────────────────────────────────────────────

export const markFailedSchema = z.object({
  adminNote: z.string().max(1000).optional(),
});

export const markFailedHandler = [
  validate(markFailedSchema),
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params["id"] as string, "withdrawal id");
    const w = await adminMarkFailed(id, req.body.adminNote);
    res.json({ success: true, message: "Withdrawal marked as failed.", data: { status: w.status } });
    fireStatusEmail(w, "failed");
  }),
];
