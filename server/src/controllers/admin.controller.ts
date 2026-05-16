import { Payment } from "../models/Payment.model";
import { User } from "../models/User.model";
import { asyncHandler } from "../utils/asyncHandler";
import { getAdminDashboard } from "../services/dashboard.service";

export const members = asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? "");
  const query: Record<string, unknown> = { role: "member" };
  if (search) {
    query.$or = [
      { fullName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phoneNumber: new RegExp(search, "i") }
    ];
  }

  const users = await User.find(query).select("-passwordHash").sort({ createdAt: -1 }).lean();
  const payments = await Payment.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: "$userId", totalPaid: { $sum: "$amount" }, paidMonths: { $addToSet: "$monthPaidFor" } } }
  ]);
  const paymentMap = new Map(payments.map((payment) => [String(payment._id), payment]));
  const enriched = users.map((user) => ({
    ...user,
    totalPaid: paymentMap.get(user._id.toString())?.totalPaid ?? 0,
    paidMonths: paymentMap.get(user._id.toString())?.paidMonths ?? []
  }));

  res.json({ success: true, message: "Members loaded.", data: { members: enriched } });
});

export const payments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.month) query.monthPaidFor = req.query.month;
  if (req.query.projectId) query.projectId = req.query.projectId;
  if (req.query.search) {
    query.$or = [
      { externalReference: new RegExp(String(req.query.search), "i") },
      { snippeReference: new RegExp(String(req.query.search), "i") },
      { customerName: new RegExp(String(req.query.search), "i") },
      { customerEmail: new RegExp(String(req.query.search), "i") }
    ];
  }

  const [rows, total] = await Promise.all([
    Payment.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("projectId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query)
  ]);

  res.json({
    success: true,
    message: "Payments loaded.",
    data: { payments: rows, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const summary = asyncHandler(async (_req, res) => {
  const dashboard = await getAdminDashboard();
  res.json({ success: true, message: "Admin summary loaded.", data: dashboard });
});

export const unpaidMembers = asyncHandler(async (_req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const paidUserIds = await Payment.distinct("userId", { status: "completed", monthPaidFor: currentMonth });
  const users = await User.find({ role: "member", _id: { $nin: paidUserIds } }).select("-passwordHash").lean();
  res.json({ success: true, message: "Unpaid members loaded.", data: { members: users } });
});

export const exportPaymentsCsv = asyncHandler(async (_req, res) => {
  const rows = await Payment.find().populate("userId", "fullName email phoneNumber").populate("projectId", "title").sort({ createdAt: -1 });
  const header = ["Date", "Member", "Amount", "Currency", "Status", "Month", "Method", "Reference"].join(",");
  const lines = rows.map((payment: any) =>
    [
      payment.createdAt.toISOString(),
      csv(payment.userId?.fullName ?? payment.customerName ?? ""),
      payment.amount,
      payment.currency,
      payment.status,
      payment.monthPaidFor,
      csv(payment.paymentMethod ?? ""),
      csv(payment.snippeReference ?? payment.externalReference)
    ].join(",")
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=sarafupay-payments.csv");
  res.send([header, ...lines].join("\n"));
});

const csv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
