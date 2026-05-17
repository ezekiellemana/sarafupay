import { Payment } from "../models/Payment.model";
import { Project, type ProjectStatus } from "../models/Project.model";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
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
  if (req.query.isActive === "true") query.isActive = true;
  if (req.query.isActive === "false") query.isActive = false;

  const [users, payments, collectionsCounts] = await Promise.all([
    User.find(query).select("-passwordHash").sort({ createdAt: -1 }).lean(),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$userId", totalPaid: { $sum: "$amount" }, paidMonths: { $addToSet: "$monthPaidFor" } } }
    ]),
    Project.aggregate([{ $group: { _id: "$ownerId", count: { $sum: 1 } } }])
  ]);

  const paymentMap = new Map(payments.map((p) => [String(p._id), p]));
  const collectionsMap = new Map(collectionsCounts.map((c) => [String(c._id), c.count as number]));

  const enriched = users.map((user) => ({
    ...user,
    totalPaid: paymentMap.get(user._id.toString())?.totalPaid ?? 0,
    paidMonths: paymentMap.get(user._id.toString())?.paidMonths ?? [],
    collectionsCount: collectionsMap.get(user._id.toString()) ?? 0
  }));

  res.json({ success: true, message: "Members loaded.", data: { members: enriched } });
});

export const getMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [user, collections, recentPayments] = await Promise.all([
    User.findById(id).select("-passwordHash").lean(),
    Project.find({ ownerId: id }).sort({ createdAt: -1 }).lean(),
    Payment.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("projectId", "title")
      .lean()
  ]);
  if (!user) throw new AppError("Member not found.", 404, "NOT_FOUND");

  const totalCollectedByCollections = collections.reduce(
    (sum, p) => sum + (p.totalCollected ?? 0),
    0
  );

  res.json({
    success: true,
    message: "Member loaded.",
    data: { user, collections, totalCollectedByCollections, recentPayments }
  });
});

export const updateMemberStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body as { isActive: unknown };

  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be a boolean.", 400, "INVALID_INPUT");
  }
  if (req.user!._id.toString() === id) {
    throw new AppError("You cannot change your own account status.", 403, "SELF_ACTION");
  }

  const target = await User.findById(id);
  if (!target) throw new AppError("Member not found.", 404, "NOT_FOUND");
  if (target.role === "admin") {
    throw new AppError("Cannot change the status of an admin account.", 403, "ADMIN_PROTECTED");
  }

  target.isActive = isActive;
  await target.save();

  const plain = target.toObject() as unknown as Record<string, unknown>;
  delete plain.passwordHash;

  res.json({
    success: true,
    message: `Member ${isActive ? "activated" : "deactivated"} successfully.`,
    data: { user: plain }
  });
});

export const getAdminCollections = asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const status = req.query.status as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

  const ownerIdSet = new Set(
    projects.filter((p) => p.ownerId).map((p) => p.ownerId!.toString())
  );
  const owners = ownerIdSet.size
    ? await User.find({ _id: { $in: [...ownerIdSet] } })
        .select("fullName email")
        .lean()
    : [];
  const ownerMap = new Map(
    owners.map((o) => [
      o._id.toString(),
      { _id: o._id.toString(), fullName: o.fullName, email: o.email },
    ])
  );

  type OwnerInfo = { _id: string; fullName: string; email: string };
  let enriched = projects.map((p) => ({
    ...p,
    owner: p.ownerId ? (ownerMap.get(p.ownerId.toString()) ?? null) : null as OwnerInfo | null,
  }));

  if (search) {
    const re = new RegExp(search, "i");
    enriched = enriched.filter(
      (p) =>
        re.test(p.title) ||
        re.test(p.slug ?? "") ||
        re.test(p.owner?.fullName ?? "") ||
        re.test(p.owner?.email ?? "")
    );
  }

  res.json({ success: true, message: "Collections loaded.", data: { collections: enriched } });
});

export const getAdminCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [project, recentPayments] = await Promise.all([
    Project.findById(id).lean(),
    Payment.find({ projectId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "fullName email")
      .lean(),
  ]);
  if (!project) throw new AppError("Collection not found.", 404, "NOT_FOUND");

  const owner = project.ownerId
    ? await User.findById(project.ownerId).select("fullName email").lean()
    : null;

  res.json({
    success: true,
    message: "Collection loaded.",
    data: {
      collection: {
        ...project,
        owner: owner
          ? { _id: owner._id.toString(), fullName: owner.fullName, email: owner.email }
          : null,
      },
      recentPayments,
    },
  });
});

export const updateAdminCollectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: unknown };

  const allowed: ProjectStatus[] = ["active", "paused", "closed"];
  if (!allowed.includes(status as ProjectStatus)) {
    throw new AppError("Invalid status. Allowed: active, paused, closed.", 400, "INVALID_INPUT");
  }

  const project = await Project.findById(id);
  if (!project) throw new AppError("Collection not found.", 404, "NOT_FOUND");

  project.status = status as ProjectStatus;
  await project.save();

  res.json({
    success: true,
    message: `Collection ${status} successfully.`,
    data: { collection: project.toObject() as unknown as Record<string, unknown> },
  });
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
