import { Types } from "mongoose";
import { Payment } from "../models/Payment.model";
import { Project } from "../models/Project.model";
import { User } from "../models/User.model";
import { Withdrawal } from "../models/Withdrawal.model";
import { AppError } from "../utils/AppError";
import { getCurrentMonth, getNextDueDate, monthRange } from "../utils/dateHelpers";

export const getMemberDashboard = async (userId: Types.ObjectId) => {
  const project = await Project.findOne({ status: "active" }).sort({ createdAt: 1 });
  if (!project) throw new AppError("No active contribution project found.", 404, "PROJECT_NOT_FOUND");

  const payments = await Payment.find({ userId, projectId: project._id }).sort({ createdAt: -1 });
  const completed = payments.filter((payment) => payment.status === "completed");
  const totalPaid = completed.reduce((sum, payment) => sum + payment.amount, 0);
  const targetAmount = project.targetAmount || fallbackTarget(project);
  const progress = targetAmount ? Math.min(Math.round((totalPaid / targetAmount) * 100), 100) : 0;
  const currentMonth = getCurrentMonth();
  const currentMonthPayment = payments.find((payment) => payment.monthPaidFor === currentMonth);
  const expectedMonths = monthRange(project.startDate, new Date());
  const paidMonths = new Set(completed.map((payment) => payment.monthPaidFor));

  return {
    project,
    totalPaid,
    completedPaymentsCount: completed.length,
    pendingPaymentsCount: payments.filter((payment) => payment.status === "pending").length,
    failedPaymentsCount: payments.filter((payment) => payment.status === "failed").length,
    lastPayment: payments[0] ?? null,
    currentMonthPaymentStatus: currentMonthPayment?.status ?? "unpaid",
    nextDueDate: getNextDueDate(),
    remainingAmount: Math.max(targetAmount - totalPaid, 0),
    contributionProgressPercentage: progress,
    missedMonths: expectedMonths.filter((month) => !paidMonths.has(month)),
    paidMonths: [...paidMonths],
    recentPayments: payments.slice(0, 6)
  };
};

export const getAdminDashboard = async () => {
  const currentMonth = getCurrentMonth();
  const monthStart = new Date(`${currentMonth}-01`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    collectedResult,
    statusCounts,
    paidThisMonthIds,
    totalMembers,
    monthlyChartRaw,
    latestPayments,
    projects,
    totalUsers,
    activeUsers,
    projectStatusCounts,
    recentUsers,
    latestCompletedPayments,
    topCollectionsRaw,
    revenueAllTimeRaw,
    revenueThisMonthRaw,
    unknownChannelCount,
    channelBreakdownRaw,
    wdrAllTimeRaw,
    wdrThisMonthRaw,
    wdrLockedRaw,
  ] = await Promise.all([
    Payment.aggregate<{ total: number }>([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Payment.distinct("userId", { status: "completed", monthPaidFor: currentMonth }),
    User.countDocuments({ role: "member", isActive: true }),
    Payment.aggregate<{ _id: string; total: number }>([
      { $match: { status: "completed" } },
      { $group: { _id: "$monthPaidFor", total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
      { $sort: { _id: 1 } }
    ]),
    Payment.find()
      .populate("userId", "fullName email phoneNumber")
      .populate("projectId", "title")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Project.find().sort({ createdAt: -1 }).lean(),
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Project.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select("-passwordHash").lean(),
    Payment.find({ status: "completed" })
      .populate("userId", "fullName email phoneNumber")
      .populate("projectId", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Payment.aggregate<{ title: string; slug: string; total: number; count: number }>([
      { $match: { status: "completed" } },
      { $group: { _id: "$projectId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, title: { $ifNull: ["$project.title", "Unknown"] }, slug: { $ifNull: ["$project.slug", ""] }, total: 1, count: 1 } },
    ]),
    Payment.aggregate<{ grossPlatformFees: number; providerCosts: number; feePaymentCount: number }>([
      { $match: { status: "completed", feeVersion: { $gte: 1 } } },
      { $group: { _id: null, grossPlatformFees: { $sum: "$serviceFee" }, providerCosts: { $sum: "$providerFee" }, feePaymentCount: { $sum: 1 } } }
    ]),
    Payment.aggregate<{ grossPlatformFeesThisMonth: number; providerCostsThisMonth: number }>([
      { $match: { status: "completed", feeVersion: { $gte: 1 }, monthPaidFor: currentMonth } },
      { $group: { _id: null, grossPlatformFeesThisMonth: { $sum: "$serviceFee" }, providerCostsThisMonth: { $sum: "$providerFee" } } }
    ]),
    Payment.countDocuments({ status: "completed", feeVersion: { $gte: 1 }, paymentChannel: "unknown" }),
    Payment.aggregate<{ _id: string; count: number; serviceFee: number; providerFee: number }>([
      { $match: { status: "completed", feeVersion: { $gte: 1 } } },
      { $group: { _id: "$paymentChannel", count: { $sum: 1 }, serviceFee: { $sum: "$serviceFee" }, providerFee: { $sum: "$providerFee" } } }
    ]),
    Withdrawal.aggregate<{ paidVolume: number; feesCollected: number; providerCosts: number }>([
      { $match: { status: "paid" } },
      { $group: { _id: null, paidVolume: { $sum: "$ownerReceives" }, feesCollected: { $sum: "$withdrawalFee" }, providerCosts: { $sum: "$providerFee" } } }
    ]),
    Withdrawal.aggregate<{ feesThisMonth: number; costsThisMonth: number; volumeThisMonth: number }>([
      { $match: { status: "paid", paidAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, feesThisMonth: { $sum: "$withdrawalFee" }, costsThisMonth: { $sum: "$providerFee" }, volumeThisMonth: { $sum: "$ownerReceives" } } }
    ]),
    Withdrawal.aggregate<{ pendingLiability: number; lockedDeductions: number }>([
      { $match: { status: { $in: ["pending", "approved", "processing"] } } },
      { $group: { _id: null, pendingLiability: { $sum: "$ownerReceives" }, lockedDeductions: { $sum: "$totalDeducted" } } }
    ]),
  ]);

  const totalCollected = collectedResult[0]?.total ?? 0;
  const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
  const projectStatusMap = new Map(projectStatusCounts.map((s) => [s._id, s.count]));
  const paidMembersThisMonth = paidThisMonthIds.length;
  const totalPayments = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const totalCollections = projectStatusCounts.reduce((sum, s) => sum + s.count, 0);

  const grossPlatformFees = revenueAllTimeRaw[0]?.grossPlatformFees ?? 0;
  const providerCosts = revenueAllTimeRaw[0]?.providerCosts ?? 0;
  const feePaymentCount = revenueAllTimeRaw[0]?.feePaymentCount ?? 0;
  const netPlatformRevenue = grossPlatformFees - providerCosts;
  const grossPlatformFeesThisMonth = revenueThisMonthRaw[0]?.grossPlatformFeesThisMonth ?? 0;
  const providerCostsThisMonth = revenueThisMonthRaw[0]?.providerCostsThisMonth ?? 0;
  const netPlatformRevenueThisMonth = grossPlatformFeesThisMonth - providerCostsThisMonth;
  const byChannel = channelBreakdownRaw.map(({ _id, count, serviceFee, providerFee }) => ({
    channel: _id,
    count,
    serviceFee,
    providerFee,
    netRevenue: serviceFee - providerFee,
  }));

  return {
    // existing fields — backward compatible
    totalCollected,
    totalMembers,
    paidMembersThisMonth,
    unpaidMembersThisMonth: Math.max(totalMembers - paidMembersThisMonth, 0),
    pendingPayments: statusMap.get("pending") ?? 0,
    failedPayments: statusMap.get("failed") ?? 0,
    monthlyChart: monthlyChartRaw.map(({ _id, total }) => ({ month: _id, total })),
    latestPayments,
    projects,
    // new fields
    totalUsers,
    activeUsers,
    totalCollections,
    activeCollections: projectStatusMap.get("active") ?? 0,
    totalPayments,
    completedPayments: statusMap.get("completed") ?? 0,
    paymentsByStatus: statusCounts.map(({ _id, count }) => ({ status: _id, count })),
    projectsByStatus: projectStatusCounts.map(({ _id, count }) => ({ status: _id, count })),
    recentUsers,
    latestCompletedPayments,
    topCollections: topCollectionsRaw,
    revenueSummary: {
      grossContributionVolume: totalCollected,
      grossPlatformFees,
      providerCosts,
      netPlatformRevenue,
      grossPlatformFeesThisMonth,
      providerCostsThisMonth,
      netPlatformRevenueThisMonth,
      feePaymentCount,
      unknownChannelCount,
      byChannel,
    },
    withdrawalRevenueSummary: {
      paidWithdrawalVolume: wdrAllTimeRaw[0]?.paidVolume ?? 0,
      withdrawalFeesCollected: wdrAllTimeRaw[0]?.feesCollected ?? 0,
      withdrawalProviderCosts: wdrAllTimeRaw[0]?.providerCosts ?? 0,
      netWithdrawalMargin: (wdrAllTimeRaw[0]?.feesCollected ?? 0) - (wdrAllTimeRaw[0]?.providerCosts ?? 0),
      withdrawalFeesThisMonth: wdrThisMonthRaw[0]?.feesThisMonth ?? 0,
      withdrawalCostsThisMonth: wdrThisMonthRaw[0]?.costsThisMonth ?? 0,
      withdrawalVolumeThisMonth: wdrThisMonthRaw[0]?.volumeThisMonth ?? 0,
      pendingLiability: wdrLockedRaw[0]?.pendingLiability ?? 0,
      lockedDeductions: wdrLockedRaw[0]?.lockedDeductions ?? 0,
    },
  };
};

const fallbackTarget = (project: { monthlyContributionAmount: number; startDate?: Date; endDate?: Date }) => {
  const months = monthRange(project.startDate, project.endDate);
  return months.length ? months.length * project.monthlyContributionAmount : project.monthlyContributionAmount * 12;
};

