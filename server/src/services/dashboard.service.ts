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
  const [members, payments, projects] = await Promise.all([
    User.find({ role: "member", isActive: true }),
    Payment.find().populate("userId", "fullName email phoneNumber").populate("projectId", "title").sort({ createdAt: -1 }),
    Project.find().sort({ createdAt: -1 })
  ]);

  const completed = payments.filter((payment) => payment.status === "completed");
  const paidThisMonth = new Set(
    completed.filter((payment) => payment.monthPaidFor === currentMonth && payment.userId).map((payment) => payment.userId?.toString())
  );
  const monthlyChart = buildMonthlyChart(completed);

  return {
    totalCollected: completed.reduce((sum, payment) => sum + payment.amount, 0),
    totalMembers: members.length,
    paidMembersThisMonth: paidThisMonth.size,
    unpaidMembersThisMonth: Math.max(members.length - paidThisMonth.size, 0),
    pendingPayments: payments.filter((payment) => payment.status === "pending").length,
    failedPayments: payments.filter((payment) => payment.status === "failed").length,
    monthlyChart,
    latestPayments: payments.slice(0, 8),
    projects
  };
};

const fallbackTarget = (project: { monthlyContributionAmount: number; startDate?: Date; endDate?: Date }) => {
  const months = monthRange(project.startDate, project.endDate);
  return months.length ? months.length * project.monthlyContributionAmount : project.monthlyContributionAmount * 12;
};

const buildMonthlyChart = (payments: { monthPaidFor: string; amount: number }[]) => {
  const totals = new Map<string, number>();
  payments.forEach((payment) => totals.set(payment.monthPaidFor, (totals.get(payment.monthPaidFor) ?? 0) + payment.amount));
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, total]) => ({ month, total }));
};
