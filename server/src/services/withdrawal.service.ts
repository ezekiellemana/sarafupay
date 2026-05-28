import type { Types } from "mongoose";
import { Project } from "../models/Project.model";
import { Payment } from "../models/Payment.model";
import { Withdrawal } from "../models/Withdrawal.model";
import { AppError } from "../utils/AppError";
import { calculateWithdrawalFee } from "./fee.service";

export type CreateWithdrawalInput = {
  requestedAmount: number;
  destinationType: "mobile_money" | "bank";
  recipientName: string;
  recipientPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ownerNote?: string;
};

export type WithdrawalBalanceResult = {
  projectId: string;
  currency: string;
  completedContributions: number;
  lockedWithdrawals: number;
  paidWithdrawals: number;
  availableForWithdrawal: number;
  withdrawalFee: number;
  minimumWithdrawalAmount: number;
  minimumBalanceRequired: number;
};

const LOCKED_STATUSES = ["pending", "approved", "processing"] as const;
const PAID_STATUS     = "paid" as const;

async function computeBalance(projectId: Types.ObjectId): Promise<WithdrawalBalanceResult> {
  const pid = projectId;

  const [contributionAgg, lockedAgg, paidAgg, project] = await Promise.all([
    Payment.aggregate<{ total: number }>([
      { $match: { projectId: pid, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Withdrawal.aggregate<{ total: number }>([
      { $match: { projectId: pid, status: { $in: [...LOCKED_STATUSES] } } },
      { $group: { _id: null, total: { $sum: "$totalDeducted" } } },
    ]),
    Withdrawal.aggregate<{ total: number }>([
      { $match: { projectId: pid, status: PAID_STATUS } },
      { $group: { _id: null, total: { $sum: "$totalDeducted" } } },
    ]),
    Project.findById(pid).select("currency").lean(),
  ]);

  const completedContributions = contributionAgg[0]?.total ?? 0;
  const lockedWithdrawals      = lockedAgg[0]?.total ?? 0;
  const paidWithdrawals        = paidAgg[0]?.total ?? 0;
  const availableForWithdrawal = Math.max(0, completedContributions - lockedWithdrawals - paidWithdrawals);

  const feeInfo = calculateWithdrawalFee(10_000);

  return {
    projectId: pid.toString(),
    currency: project?.currency ?? "TZS",
    completedContributions,
    lockedWithdrawals,
    paidWithdrawals,
    availableForWithdrawal,
    withdrawalFee: feeInfo.withdrawalFee,
    minimumWithdrawalAmount: feeInfo.minimumWithdrawalAmount,
    minimumBalanceRequired: feeInfo.minimumWithdrawalAmount + feeInfo.withdrawalFee,
  };
}

export async function getWithdrawalBalance(
  projectId: Types.ObjectId,
  ownerId: Types.ObjectId,
): Promise<WithdrawalBalanceResult> {
  const collection = await Project.findOne({ _id: projectId, ownerId }).lean();
  if (!collection) {
    throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");
  }
  return computeBalance(projectId);
}

export async function createWithdrawalRequest(
  ownerId: Types.ObjectId,
  projectId: Types.ObjectId,
  input: CreateWithdrawalInput,
) {
  // 1. Verify ownership
  const collection = await Project.findOne({ _id: projectId, ownerId }).lean();
  if (!collection) {
    throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");
  }

  // 2. Validate requested amount and compute fees
  let feeResult;
  try {
    feeResult = calculateWithdrawalFee(input.requestedAmount);
  } catch {
    throw new AppError(
      `Minimum withdrawal amount is TZS 10,000.`,
      400,
      "AMOUNT_TOO_LOW",
    );
  }

  const { totalDeducted, withdrawalFee, estimatedProviderFee, ownerReceives } = feeResult;

  // 3. Pre-check balance
  const preBalance = await computeBalance(projectId);
  if (preBalance.availableForWithdrawal < totalDeducted) {
    throw new AppError(
      `Insufficient balance. Available: TZS ${preBalance.availableForWithdrawal.toLocaleString()}, required: TZS ${totalDeducted.toLocaleString()}.`,
      409,
      "INSUFFICIENT_BALANCE",
    );
  }

  // 4. Validate destination
  if (input.destinationType === "mobile_money") {
    if (!input.recipientPhone?.trim()) {
      throw new AppError("recipientPhone is required for mobile_money withdrawals.", 400, "INVALID_DESTINATION");
    }
  } else if (input.destinationType === "bank") {
    if (!input.bankName?.trim() || !input.bankAccountNumber?.trim()) {
      throw new AppError("bankName and bankAccountNumber are required for bank withdrawals.", 400, "INVALID_DESTINATION");
    }
  } else {
    throw new AppError("Invalid destinationType.", 400, "INVALID_DESTINATION");
  }

  // 5. Create withdrawal — this atomically includes totalDeducted in lockedWithdrawals
  const withdrawal = await Withdrawal.create({
    ownerId,
    projectId,
    requestedAmount: input.requestedAmount,
    withdrawalFee,
    providerFee: estimatedProviderFee,
    totalDeducted,
    ownerReceives,
    currency: collection.currency ?? "TZS",
    destinationType: input.destinationType,
    recipientName: input.recipientName.trim(),
    recipientPhone: input.recipientPhone?.trim(),
    bankName: input.bankName?.trim(),
    bankAccountNumber: input.bankAccountNumber?.trim(),
    ownerNote: input.ownerNote?.trim(),
    status: "pending",
    requestedAt: new Date(),
    balanceSnapshot: {
      completedContributions: preBalance.completedContributions,
      lockedWithdrawals:      preBalance.lockedWithdrawals,
      paidWithdrawals:        preBalance.paidWithdrawals,
      availableForWithdrawal: preBalance.availableForWithdrawal,
    },
  });

  // 6. Optimistic re-check — the new pending doc is now included in lockedWithdrawals
  const postBalance = await computeBalance(projectId);
  if (postBalance.availableForWithdrawal < 0) {
    // Concurrent submission drove the balance negative — cancel and reject
    withdrawal.status = "cancelled";
    withdrawal.cancelledAt = new Date();
    withdrawal.adminNote = "Auto-cancelled: concurrent withdrawal request caused balance conflict.";
    await withdrawal.save();
    throw new AppError(
      "Balance conflict: another withdrawal was submitted at the same time. Please retry.",
      409,
      "BALANCE_CONFLICT",
    );
  }

  return withdrawal;
}

export async function cancelWithdrawalRequest(
  ownerId: Types.ObjectId,
  projectId: Types.ObjectId,
  withdrawalId: Types.ObjectId,
) {
  const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, projectId, ownerId });
  if (!withdrawal) {
    throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  }
  if (withdrawal.status !== "pending") {
    throw new AppError(
      `Only pending withdrawals can be cancelled. Current status: ${withdrawal.status}.`,
      409,
      "INVALID_WITHDRAWAL_STATUS",
    );
  }

  withdrawal.status = "cancelled";
  withdrawal.cancelledAt = new Date();
  await withdrawal.save();

  return withdrawal;
}
