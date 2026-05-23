import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import {
  createCollection,
  closeCollection,
  getCollectionByIdForOwner,
  getCollectionPayments,
  getCollectionSummary,
  getOwnerCollections,
  getOwnerRecentActivity,
  getPublicCollectionBySlug,
  updateCollection
} from "../services/collection.service";
import { Payment } from "../models/Payment.model";
import { Project } from "../models/Project.model";

export const createCollectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters.").max(120),
  description: z.string().max(1000).optional(),
  collectionType: z
    .enum(["monthly_contribution", "event", "wedding", "birthday", "charity", "emergency", "school", "church", "mosque", "trip", "business", "custom"])
    .optional(),
  targetAmount: z.coerce.number().min(0).optional(),
  suggestedAmount: z.coerce.number().min(0).optional(),
  minimumAmount: z.coerce.number().min(0).optional(),
  currency: z.string().default("TZS"),
  allowCustomAmount: z.boolean().default(true),
  showContributors: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  paymentPurpose: z.string().max(500).optional(),
  thankYouMessage: z.string().max(500).optional()
});

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  status: z.enum(["draft", "active", "paused", "completed", "closed"]).optional()
});

export const myCollections = asyncHandler(async (req, res) => {
  const collections = await getOwnerCollections(req.user!._id);
  res.json({ success: true, message: "Collections loaded.", data: { collections } });
});

export const createCollectionHandler = asyncHandler(async (req, res) => {
  const collection = await createCollection(req.user!._id, req.body);
  res.status(201).json({ success: true, message: "Collection created successfully.", data: { collection } });
});

export const getCollectionHandler = asyncHandler(async (req, res) => {
  const collection = await getCollectionByIdForOwner(req.params.id as string, req.user!._id);
  res.json({ success: true, message: "Collection loaded.", data: { collection } });
});

export const publicCollectionHandler = asyncHandler(async (req, res) => {
  const collection = await getPublicCollectionBySlug(req.params.slug as string);
  res.json({ success: true, message: "Collection loaded.", data: { collection } });
});

export const updateCollectionHandler = asyncHandler(async (req, res) => {
  const collection = await updateCollection(req.params.id as string, req.user!._id, req.body);
  res.json({ success: true, message: "Collection updated.", data: { collection } });
});

export const closeCollectionHandler = asyncHandler(async (req, res) => {
  await closeCollection(req.params.id as string, req.user!._id);
  res.json({ success: true, message: "Collection closed.", data: {} });
});

export const collectionPaymentsHandler = asyncHandler(async (req, res) => {
  const payments = await getCollectionPayments(req.params.id as string, req.user!._id);
  res.json({ success: true, message: "Payments loaded.", data: { payments } });
});

export const collectionSummaryHandler = asyncHandler(async (req, res) => {
  const summary = await getCollectionSummary(req.params.id as string, req.user!._id);
  res.json({ success: true, message: "Summary loaded.", data: summary });
});

export const exportCollectionCsvHandler = asyncHandler(async (req, res) => {
  const collection = await Project.findOne({ _id: req.params.id, ownerId: req.user!._id });
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");

  const payments = await Payment.find({ projectId: collection._id }).sort({ createdAt: -1 }).lean();

  const header = ["Date", "Payer Name", "Phone", "Email", "Amount", "Currency", "Status", "Method", "Reference", "Message"].join(",");
  const lines = payments.map((p) =>
    [
      p.createdAt.toISOString(),
      csv(p.customerName ?? ""),
      csv(p.customerPhone ?? ""),
      csv(p.customerEmail ?? ""),
      p.amount,
      p.currency,
      p.status,
      csv(p.paymentMethod ?? ""),
      csv(p.snippeReference ?? p.externalReference),
      csv(p.payerMessage ?? "")
    ].join(",")
  );

  const title = collection.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=sarafupay-${title}-contributors.csv`);
  res.send([header, ...lines].join("\n"));
});

export const collectionActivityHandler = asyncHandler(async (req, res) => {
  const raw = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = isNaN(raw) || raw < 1 ? 10 : Math.min(raw, 20);
  const payments = await getOwnerRecentActivity(req.user!._id, limit);

  type PopulatedProject = { _id: { toString(): string }; title?: string; slug?: string; status?: string };

  const activity = payments.map((p) => {
    const project = p.projectId as unknown as PopulatedProject | null;
    return {
      _id: p._id,
      collectionId: project?._id?.toString() ?? null,
      collectionTitle: project?.title ?? "Unknown collection",
      collectionSlug: project?.slug ?? "",
      collectionStatus: project?.status ?? "",
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      customerName: p.customerName ?? null,
      paymentMethod: p.paymentMethod ?? null,
      createdAt: p.createdAt,
      paidAt: p.paidAt ?? null,
    };
  });

  res.json({ success: true, message: "Activity loaded.", data: { activity } });
});

const csv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
