import { Types } from "mongoose";
import { Payment } from "../models/Payment.model";
import { Project } from "../models/Project.model";
import { User } from "../models/User.model";
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
    recentPayments: payments.slice(0, 6)
  };
};

export const getAdminDashboard = async () => {
  const currentMonth = getCurrentMonth();

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
  ]);

  const totalCollected = collectedResult[0]?.total ?? 0;
  const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
  const projectStatusMap = new Map(projectStatusCounts.map((s) => [s._id, s.count]));
  const paidMembersThisMonth = paidThisMonthIds.length;
  const totalPayments = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const totalCollections = projectStatusCounts.reduce((sum, s) => sum + s.count, 0);

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
  };
};

const fallbackTarget = (project: { monthlyContributionAmount: number; startDate?: Date; endDate?: Date }) => {
  const months = monthRange(project.startDate, project.endDate);
  return months.length ? months.length * project.monthlyContributionAmount : project.monthlyContributionAmount * 12;
};

