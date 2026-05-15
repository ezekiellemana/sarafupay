import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import {
  createCollection,
  deleteCollection,
  getCollectionByIdForOwner,
  getCollectionPayments,
  getCollectionSummary,
  getOwnerCollections,
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

export const deleteCollectionHandler = asyncHandler(async (req, res) => {
  await deleteCollection(req.params.id as string, req.user!._id);
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

const csv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
