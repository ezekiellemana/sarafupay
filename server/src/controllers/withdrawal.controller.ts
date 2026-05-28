import { z } from "zod";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { validate } from "../middleware/validate.middleware";
import {
  getWithdrawalBalance,
  createWithdrawalRequest,
  cancelWithdrawalRequest,
} from "../services/withdrawal.service";
import { Withdrawal, type IWithdrawal } from "../models/Withdrawal.model";
import { Project } from "../models/Project.model";

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

function safeWithdrawal(w: IWithdrawal & { _id: mongoose.Types.ObjectId }) {
  return {
    id: w._id.toString(),
    status: w.status,
    requestedAmount: w.requestedAmount,
    withdrawalFee: w.withdrawalFee,
    totalDeducted: w.totalDeducted,
    ownerReceives: w.ownerReceives,
    currency: w.currency,
    destinationType: w.destinationType,
    recipientName: w.recipientName,
    maskedRecipientPhone: maskPhone(w.recipientPhone),
    maskedBankAccountNumber:
      w.destinationType === "bank" ? maskBankAccount(w.bankAccountNumber) : undefined,
    bankName: w.bankName,
    requestedAt: w.requestedAt,
    approvedAt: w.approvedAt,
    processingAt: w.processingAt,
    paidAt: w.paidAt,
    rejectedAt: w.rejectedAt,
    failedAt: w.failedAt,
    cancelledAt: w.cancelledAt,
    adminNote: w.adminNote,
    rejectionReason: w.rejectionReason,
    payoutReference: w.status === "paid" ? w.payoutReference : undefined,
  };
}

function parseObjectId(raw: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(raw)) {
    throw new AppError(`Invalid ${label}.`, 400, "INVALID_ID");
  }
  return new mongoose.Types.ObjectId(raw);
}

export const withdrawalSummaryHandler = asyncHandler(async (req, res) => {
  const projectId = parseObjectId(req.params["id"] as string, "collection id");
  const summary = await getWithdrawalBalance(projectId, req.user!._id);
  res.json({
    success: true,
    message: "Withdrawal summary loaded.",
    data: {
      completedContributions: summary.completedContributions,
      lockedWithdrawals: summary.lockedWithdrawals,
      paidWithdrawals: summary.paidWithdrawals,
      availableForWithdrawal: summary.availableForWithdrawal,
      withdrawalFee: summary.withdrawalFee,
      minimumWithdrawalAmount: summary.minimumWithdrawalAmount,
      minimumBalanceRequired: summary.minimumBalanceRequired,
    },
  });
});

export const listWithdrawalsHandler = asyncHandler(async (req, res) => {
  const projectId = parseObjectId(req.params["id"] as string, "collection id");
  const ownerId = req.user!._id;

  const collection = await Project.findOne({ _id: projectId, ownerId }).lean();
  if (!collection) {
    throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");
  }

  const withdrawals = await Withdrawal.find({ projectId, ownerId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    message: "Withdrawals loaded.",
    data: { withdrawals: withdrawals.map(safeWithdrawal) },
  });
});

export const createWithdrawalSchema = z.object({
  requestedAmount: z
    .number()
    .int("requestedAmount must be a whole-number TZS amount.")
    .positive("requestedAmount must be positive.")
    .min(10_000, "Minimum withdrawal amount is TZS 10,000."),
  destinationType: z.enum(["mobile_money", "bank"]),
  recipientName: z.string().min(2, "recipientName must be at least 2 characters.").trim(),
  recipientPhone: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  ownerNote: z.string().max(500).trim().optional(),
});

export const createWithdrawalHandler = [
  validate(createWithdrawalSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseObjectId(req.params["id"] as string, "collection id");
    const withdrawal = await createWithdrawalRequest(req.user!._id, projectId, req.body);
    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted.",
      data: { withdrawal: safeWithdrawal(withdrawal.toObject()) },
    });
  }),
];

export const cancelWithdrawalHandler = asyncHandler(async (req, res) => {
  const projectId    = parseObjectId(req.params["id"] as string,           "collection id");
  const withdrawalId = parseObjectId(req.params["withdrawalId"] as string, "withdrawal id");
  const withdrawal = await cancelWithdrawalRequest(req.user!._id, projectId, withdrawalId);
  res.json({
    success: true,
    message: "Withdrawal cancelled.",
    data: { withdrawal: safeWithdrawal(withdrawal.toObject()) },
  });
});
