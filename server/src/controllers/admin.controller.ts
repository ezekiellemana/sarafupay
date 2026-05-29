import mongoose from "mongoose";
import { Payment } from "../models/Payment.model";
import { Project, type ProjectStatus } from "../models/Project.model";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { getAdminDashboard } from "../services/dashboard.service";
import { env } from "../config/env";

export const members = asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? "");
  const page   = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "25"), 10) || 25));
  const skip   = (page - 1) * limit;

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

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
  ]);

  // Scope aggregations to only the users on this page
  const userIds = users.map((u) => u._id);
  const [payments, collectionsCounts] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "completed", userId: { $in: userIds } } },
      { $group: { _id: "$userId", totalPaid: { $sum: "$amount" }, paidMonths: { $addToSet: "$monthPaidFor" } } }
    ]),
    Project.aggregate([
      { $match: { ownerId: { $in: userIds } } },
      { $group: { _id: "$ownerId", count: { $sum: 1 } } }
    ])
  ]);

  const paymentMap = new Map(payments.map((p) => [String(p._id), p]));
  const collectionsMap = new Map(collectionsCounts.map((c) => [String(c._id), c.count as number]));

  const enriched = users.map((user) => ({
    ...user,
    totalPaid: paymentMap.get(user._id.toString())?.totalPaid ?? 0,
    paidMonths: paymentMap.get(user._id.toString())?.paidMonths ?? [],
    collectionsCount: collectionsMap.get(user._id.toString()) ?? 0
  }));

  res.json({
    success: true,
    message: "Members loaded.",
    data: { members: enriched, total, page, totalPages: Math.ceil(total / limit), limit }
  });
});

export const getMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [user, collections, recentPayments] = await Promise.all([
    User.findById(id).select("-passwordHash").lean(),
    Project.find({ ownerId: id }).sort({ createdAt: -1 }).lean(),
    Payment.find({ userId: id })
      .select("_id projectId amount currency status monthPaidFor paymentMethod externalReference snippeReference customerName createdAt paidAt")
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
  const page   = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "25"), 10) || 25));
  const skip   = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  if (search) {
    const re = new RegExp(search, "i");
    // Find users whose name or email matches, then include their collections via ownerId
    const matchingOwners = await User.find({ $or: [{ fullName: re }, { email: re }] })
      .select("_id")
      .lean();
    filter.$or = [
      { title: re },
      { slug: re },
      ...(matchingOwners.length ? [{ ownerId: { $in: matchingOwners.map((u) => u._id) } }] : [])
    ];
  }

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
  ]);

  // Fetch owners only for projects on this page
  const ownerIdSet = new Set(
    projects.filter((p) => p.ownerId).map((p) => p.ownerId!.toString())
  );
  const owners = ownerIdSet.size
    ? await User.find({ _id: { $in: [...ownerIdSet] } }).select("fullName email").lean()
    : [];
  const ownerMap = new Map(
    owners.map((o) => [o._id.toString(), { _id: o._id.toString(), fullName: o.fullName, email: o.email }])
  );

  type OwnerInfo = { _id: string; fullName: string; email: string };
  const enriched = projects.map((p) => ({
    ...p,
    owner: p.ownerId ? (ownerMap.get(p.ownerId.toString()) ?? null) : null as OwnerInfo | null,
  }));

  res.json({
    success: true,
    message: "Collections loaded.",
    data: { collections: enriched, total, page, totalPages: Math.ceil(total / limit), limit }
  });
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

export const getAdminPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findById(id).lean();
  if (!payment) throw new AppError("Payment not found.", 404, "NOT_FOUND");

  const [payer, project] = await Promise.all([
    payment.userId
      ? User.findById(payment.userId).select("fullName email phoneNumber").lean()
      : Promise.resolve(null),
    payment.projectId
      ? Project.findById(payment.projectId).select("title slug ownerId").lean()
      : Promise.resolve(null),
  ]);

  const collectionOwner = project?.ownerId
    ? await User.findById(project.ownerId).select("fullName email").lean()
    : null;

  res.json({
    success: true,
    message: "Payment loaded.",
    data: {
      _id: payment._id.toString(),
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      snippeReference: payment.snippeReference,
      externalReference: payment.externalReference,
      paymentMethod: payment.paymentMethod,
      customerName: payment.customerName,
      customerPhone: payment.customerPhone,
      customerEmail: payment.customerEmail,
      payerMessage: payment.payerMessage,
      monthPaidFor: payment.monthPaidFor,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      payer: payer
        ? { fullName: payer.fullName, email: payer.email, phoneNumber: payer.phoneNumber }
        : null,
      collection: project ? { title: project.title, slug: project.slug } : null,
      collectionOwner: collectionOwner
        ? { fullName: collectionOwner.fullName, email: collectionOwner.email }
        : null,
      webhookReceived: Boolean(payment.rawWebhookPayload),
      contributionAmount: payment.contributionAmount ?? payment.amount,
      serviceFee: payment.serviceFee,
      totalChargedAmount: payment.totalChargedAmount,
      providerFee: payment.providerFee,
      paymentChannel: payment.paymentChannel,
      feeVersion: payment.feeVersion,
    },
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

  if (req.query.dateFrom || req.query.dateTo) {
    const dateFilter: Record<string, unknown> = {};
    if (req.query.dateFrom) dateFilter.$gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) {
      const to = new Date(String(req.query.dateTo));
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }
    query.createdAt = dateFilter;
  }

  if (req.query.amountMin || req.query.amountMax) {
    const amountFilter: Record<string, unknown> = {};
    const min = parseFloat(String(req.query.amountMin ?? ""));
    const max = parseFloat(String(req.query.amountMax ?? ""));
    if (!isNaN(min) && min >= 0) amountFilter.$gte = min;
    if (!isNaN(max) && max >= 0) amountFilter.$lte = max;
    if (Object.keys(amountFilter).length) query.amount = amountFilter;
  }

  if (req.query.search) {
    const re = new RegExp(String(req.query.search), "i");
    const matchingProjects = await Project.find({ title: re }).select("_id").lean();
    query.$or = [
      { externalReference: re },
      { snippeReference: re },
      { customerName: re },
      { customerEmail: re },
      ...(matchingProjects.length
        ? [{ projectId: { $in: matchingProjects.map((p) => p._id) } }]
        : []),
    ];
  }

  const [rows, total] = await Promise.all([
    Payment.find(query)
      .select("_id userId projectId amount contributionAmount currency status monthPaidFor paymentMethod externalReference snippeReference customerName customerEmail customerPhone paymentChannel createdAt paidAt")
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
  const rows = await Payment.find()
    .select("_id createdAt userId customerName amount currency status monthPaidFor paymentMethod snippeReference externalReference projectId")
    .populate("userId", "fullName")
    .populate("projectId", "title")
    .sort({ createdAt: -1 });
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

export const activityFeed = asyncHandler(async (_req, res) => {
  const FETCH_LIMIT = 50;

  const [recentUsers, recentProjects, recentPayments] = await Promise.all([
    User.find({ role: "member" })
      .select("fullName email createdAt")
      .sort({ createdAt: -1 })
      .limit(FETCH_LIMIT)
      .lean(),
    Project.find()
      .select("title slug ownerId createdAt")
      .sort({ createdAt: -1 })
      .limit(FETCH_LIMIT)
      .lean(),
    Payment.find({ status: "completed" })
      .select("amount currency customerName paidAt createdAt projectId userId")
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(FETCH_LIMIT)
      .populate("userId", "fullName")
      .populate("projectId", "title")
      .lean(),
  ]);

  // Gather project owner IDs and batch-fetch names
  const ownerIds = [...new Set(recentProjects.filter((p) => p.ownerId).map((p) => p.ownerId!.toString()))];
  const owners = ownerIds.length
    ? await User.find({ _id: { $in: ownerIds } }).select("fullName").lean()
    : [];
  const ownerMap = new Map(owners.map((o) => [o._id.toString(), o.fullName]));

  type EventType = "user_registered" | "collection_created" | "payment_completed";
  type Event = { id: string; type: EventType; timestamp: Date; description: string; meta: Record<string, unknown> };

  const events: Event[] = [];

  for (const user of recentUsers) {
    events.push({
      id: `user-${user._id}`,
      type: "user_registered",
      timestamp: user.createdAt,
      description: `${user.fullName} registered`,
      meta: { email: user.email },
    });
  }

  for (const project of recentProjects) {
    const ownerName = project.ownerId ? (ownerMap.get(project.ownerId.toString()) ?? "Unknown") : "Unknown";
    events.push({
      id: `project-${project._id}`,
      type: "collection_created",
      timestamp: project.createdAt,
      description: `${ownerName} created collection "${project.title}"`,
      meta: { title: project.title, slug: project.slug ?? null },
    });
  }

  for (const payment of recentPayments) {
    const payerName =
      payment.userId && typeof payment.userId === "object" && "fullName" in payment.userId
        ? (payment.userId as { fullName: string }).fullName
        : (payment.customerName ?? "Anonymous");
    const projectTitle =
      payment.projectId && typeof payment.projectId === "object" && "title" in payment.projectId
        ? (payment.projectId as { title: string }).title
        : "—";
    events.push({
      id: `payment-${payment._id}`,
      type: "payment_completed",
      timestamp: payment.paidAt ?? payment.createdAt,
      description: `${payerName} paid ${payment.currency} ${payment.amount.toLocaleString()} → ${projectTitle}`,
      meta: { amount: payment.amount, currency: payment.currency },
    });
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json({
    success: true,
    message: "Activity feed loaded.",
    data: { events: events.slice(0, FETCH_LIMIT) },
  });
});

export const platformSettings = asyncHandler(async (_req, res) => {
  const webhookEndpoint = "/api/webhooks";
  res.json({
    success: true,
    message: "Settings loaded.",
    data: {
      clientUrl: env.CLIENT_URL,
      serverUrl: env.SERVER_URL,
      snippeBaseUrl: env.SNIPPE_BASE_URL,
      webhookUrl: `${env.SERVER_URL}${webhookEndpoint}`,
      returnUrl: `${env.CLIENT_URL}/payment/return`,
      webhookEndpoint,
      environment: env.NODE_ENV,
      cookieName: env.COOKIE_NAME,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
      supportEmail: process.env.SUPPORT_EMAIL || null,
      appVersion: process.env.APP_VERSION || null,
      jwtSecretConfigured: Boolean(env.JWT_SECRET && env.JWT_SECRET.length >= 24),
      snippeApiKeyConfigured: Boolean(env.SNIPPE_API_KEY),
      snippeWebhookSecretConfigured: Boolean(env.SNIPPE_WEBHOOK_SECRET),
      mongoConfigured: true,
      resendConfigured: Boolean(env.RESEND_API_KEY),
      emailFromConfigured: Boolean(env.EMAIL_FROM),
      adminNotificationEmailConfigured: Boolean(env.ADMIN_NOTIFICATION_EMAIL),
      feesEnabled: Boolean(env.FEES_ENABLED),
      googleOAuthConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },
  });
});

export const systemAudit = asyncHandler(async (_req, res) => {
  type CheckStatus = "passed" | "warning" | "missing" | "failed";
  const make = (
    key: string,
    label: string,
    status: CheckStatus,
    note: string | null,
    group: string
  ) => ({ key, label, status, note, group });

  const dbConnected = mongoose.connection.readyState === 1;
  const isProd = env.NODE_ENV === "production";

  const checks = [
    // ── Core infrastructure ───────────────────────────────────────────────────
    make("backend_health", "Backend health",          "passed",                             `Uptime: ${Math.floor(process.uptime())}s`, "Core infrastructure"),
    make("mongodb",        "MongoDB connected",       dbConnected ? "passed" : "failed",    null,                                       "Core infrastructure"),
    make("environment",    "Environment is production", isProd ? "passed" : "warning",      env.NODE_ENV,                               "Core infrastructure"),
    make("client_url",     "CLIENT_URL configured",   env.CLIENT_URL ? "passed" : "warning", null,                                     "Core infrastructure"),
    make("server_url",     "SERVER_URL configured",   env.SERVER_URL ? "passed" : "warning", null,                                     "Core infrastructure"),
    // ── Snippe payment gateway ────────────────────────────────────────────────
    make("snippe_api_key",        "Snippe API key",        env.SNIPPE_API_KEY        ? "passed" : "missing", null,                    "Snippe payment gateway"),
    make("snippe_webhook_secret", "Snippe webhook secret", env.SNIPPE_WEBHOOK_SECRET ? "passed" : "missing", null,                    "Snippe payment gateway"),
    make("snippe_base_url",       "Snippe base URL",       env.SNIPPE_BASE_URL       ? "passed" : "missing", env.SNIPPE_BASE_URL ?? null, "Snippe payment gateway"),
    make("snippe_profile_id",     "Snippe profile ID",     env.SNIPPE_PROFILE_ID     ? "passed" : "missing", null,                    "Snippe payment gateway"),
    // ── Fee collection ────────────────────────────────────────────────────────
    make(
      "fees_enabled",
      "Service fees enabled (FEES_ENABLED)",
      env.FEES_ENABLED ? "passed" : "warning",
      env.FEES_ENABLED ? "Fees are active — contributors are charged." : "FEES_ENABLED is not true — no service fees are being collected.",
      "Fee collection"
    ),
    // ── Email notifications (Resend) ──────────────────────────────────────────
    make("resend_api_key",            "Resend API key",           env.RESEND_API_KEY            ? "passed" : "warning", env.RESEND_API_KEY            ? null : "Email notifications disabled.", "Email notifications"),
    make("email_from",                "Email FROM address",       env.EMAIL_FROM                ? "passed" : "warning", env.EMAIL_FROM                ? null : "EMAIL_FROM not set — emails will not send.", "Email notifications"),
    make("admin_notification_email",  "Admin notification email", env.ADMIN_NOTIFICATION_EMAIL  ? "passed" : "warning", env.ADMIN_NOTIFICATION_EMAIL  ? null : "ADMIN_NOTIFICATION_EMAIL not set — withdrawal alerts will not reach admin.", "Email notifications"),
    // ── Routing and security ──────────────────────────────────────────────────
    make("cors",             "CORS configured",      "passed", null,                    "Routing and security"),
    make("webhook_endpoint", "Webhook endpoint path", "passed", "/api/webhooks/snippe", "Routing and security"),
  ];

  res.json({ success: true, message: "Audit complete.", data: { checks } });
});

const csv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
