import { type Types } from "mongoose";
import { User } from "../models/User.model";
import { Project } from "../models/Project.model";
import { Payment } from "../models/Payment.model";
import { Withdrawal, type WithdrawalStatus } from "../models/Withdrawal.model";
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

// ─── Admin functions ─────────────────────────────────────────────────────────

export type AdminWithdrawalQuery = {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

function assertValidTransition(current: WithdrawalStatus, allowed: WithdrawalStatus[]) {
  if (!allowed.includes(current)) {
    throw new AppError(
      `Cannot transition from "${current}". Allowed from: ${allowed.join(", ")}.`,
      409,
      "INVALID_WITHDRAWAL_STATUS",
    );
  }
}

export async function adminListWithdrawals(query: AdminWithdrawalQuery) {
  const { status, search, dateFrom, dateTo, page = 1, limit = 20 } = query;
  const filter: Record<string, unknown> = {};

  if (status && status !== "all") filter.status = status;

  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.$gte = new Date(dateFrom);
    if (dateTo) range.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    filter.requestedAt = range;
  }

  if (search) {
    const re = new RegExp(search, "i");
    const [matchingOwners, matchingCollections] = await Promise.all([
      User.find({ $or: [{ fullName: re }, { email: re }] }).select("_id").lean(),
      Project.find({ title: re }).select("_id").lean(),
    ]);
    const ownerIds = matchingOwners.map((u) => u._id);
    const collectionIds = matchingCollections.map((c) => c._id);

    if (ownerIds.length === 0 && collectionIds.length === 0) {
      return { withdrawals: [], total: 0, page, totalPages: 0, summary: await adminSummary() };
    }
    filter.$or = [
      ...(ownerIds.length > 0 ? [{ ownerId: { $in: ownerIds } }] : []),
      ...(collectionIds.length > 0 ? [{ projectId: { $in: collectionIds } }] : []),
    ];
  }

  const skip = (page - 1) * limit;
  const [withdrawals, total, summaryData] = await Promise.all([
    Withdrawal.find(filter)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("ownerId", "fullName email")
      .populate("projectId", "title slug")
      .lean(),
    Withdrawal.countDocuments(filter),
    adminSummary(),
  ]);

  return {
    withdrawals,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: summaryData,
  };
}

async function adminSummary() {
  const [pending, active, paid, totalAgg] = await Promise.all([
    Withdrawal.countDocuments({ status: "pending" }),
    Withdrawal.countDocuments({ status: { $in: ["approved", "processing"] } }),
    Withdrawal.countDocuments({ status: "paid" }),
    Withdrawal.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]),
  ]);
  return {
    pendingCount: pending,
    activeCount: active,
    paidCount: paid,
    totalRequested: totalAgg[0]?.total ?? 0,
  };
}

export async function adminGetWithdrawal(withdrawalId: Types.ObjectId) {
  const withdrawal = await Withdrawal.findById(withdrawalId)
    .populate("ownerId", "fullName email phoneNumber")
    .populate("projectId", "title slug currency")
    .populate("approvedBy", "fullName")
    .populate("rejectedBy", "fullName")
    .populate("paidBy", "fullName")
    .lean();

  if (!withdrawal) {
    throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  }

  const projectId = withdrawal.projectId as unknown as { _id: Types.ObjectId };
  const liveBalance = await computeBalance(
    projectId._id ?? (withdrawal.projectId as Types.ObjectId),
  );

  return { withdrawal, liveBalance };
}

export async function adminApproveWithdrawal(
  adminId: Types.ObjectId,
  withdrawalId: Types.ObjectId,
  adminNote?: string,
) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  assertValidTransition(w.status, ["pending"]);

  w.status = "approved";
  w.approvedBy = adminId;
  w.approvedAt = new Date();
  if (adminNote) w.adminNote = adminNote;
  await w.save();
  return w;
}

export async function adminRejectWithdrawal(
  adminId: Types.ObjectId,
  withdrawalId: Types.ObjectId,
  rejectionReason: string,
) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  assertValidTransition(w.status, ["pending", "approved"]);

  w.status = "rejected";
  w.rejectedBy = adminId;
  w.rejectedAt = new Date();
  w.rejectionReason = rejectionReason;
  await w.save();
  return w;
}

export async function adminMarkProcessing(withdrawalId: Types.ObjectId) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  assertValidTransition(w.status, ["approved"]);

  w.status = "processing";
  w.processingAt = new Date();
  await w.save();
  return w;
}

export async function adminMarkPaid(
  adminId: Types.ObjectId,
  withdrawalId: Types.ObjectId,
  payoutReference: string,
  adminNote?: string,
) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  assertValidTransition(w.status, ["approved", "processing"]);

  w.status = "paid";
  w.paidBy = adminId;
  w.paidAt = new Date();
  w.payoutReference = payoutReference;
  if (adminNote) w.adminNote = adminNote;
  await w.save();
  return w;
}

export async function adminMarkFailed(
  withdrawalId: Types.ObjectId,
  adminNote?: string,
) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new AppError("Withdrawal not found.", 404, "WITHDRAWAL_NOT_FOUND");
  assertValidTransition(w.status, ["processing"]);

  w.status = "failed";
  w.failedAt = new Date();
  if (adminNote) w.adminNote = adminNote;
  await w.save();
  return w;
}

