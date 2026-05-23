import type { Types } from "mongoose";
import { Project } from "../models/Project.model";
import { Payment } from "../models/Payment.model";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { generateUniqueSlug } from "../utils/slugify";
import { env } from "../config/env";

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new AppError(`Invalid date value: "${value}"`, 400, "INVALID_DATE");
  return d;
};

export type CreateCollectionInput = {
  title: string;
  description?: string;
  collectionType?: string;
  targetAmount?: number;
  suggestedAmount?: number;
  minimumAmount?: number;
  currency?: string;
  allowCustomAmount?: boolean;
  showContributors?: boolean;
  startDate?: string;
  endDate?: string;
  visibility?: string;
  coverImageUrl?: string;
  paymentPurpose?: string;
  thankYouMessage?: string;
};

export const createCollection = async (ownerId: Types.ObjectId, input: CreateCollectionInput) => {
  const slug = await generateUniqueSlug(input.title);
  const publicPaymentLink = `${env.CLIENT_URL}/pay/${slug}`;

  const collection = await Project.create({
    ownerId,
    createdBy: ownerId,
    title: input.title,
    slug,
    description: input.description ?? "",
    collectionType: (input.collectionType ?? "custom") as "custom",
    targetAmount: input.targetAmount,
    suggestedAmount: input.suggestedAmount,
    minimumAmount: input.minimumAmount,
    monthlyContributionAmount: input.suggestedAmount ?? 0,
    currency: input.currency ?? "TZS",
    allowCustomAmount: input.allowCustomAmount !== false,
    startDate: parseDate(input.startDate),
    endDate: parseDate(input.endDate),
    status: "active",
    visibility: (input.visibility ?? "public") as "public" | "private",
    coverImageUrl: input.coverImageUrl,
    paymentPurpose: input.paymentPurpose,
    thankYouMessage: input.thankYouMessage,
    showContributors: input.showContributors ?? false,
    publicPaymentLink,
    totalCollected: 0,
    contributorCount: 0
  });

  return collection;
};

export const getOwnerCollections = async (ownerId: Types.ObjectId) => {
  const collections = await Project.find({ ownerId }).sort({ createdAt: -1 }).lean();
  // Always compute publicPaymentLink from current CLIENT_URL so domain changes
  // (e.g. Vercel → custom domain) are reflected without a data migration.
  return collections.map((c) => ({ ...c, publicPaymentLink: `${env.CLIENT_URL}/pay/${c.slug}` }));
};

export const getCollectionByIdForOwner = async (id: string, ownerId: Types.ObjectId) => {
  const collection = await Project.findOne({ _id: id, ownerId }).lean();
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");
  return { ...collection, publicPaymentLink: `${env.CLIENT_URL}/pay/${collection.slug}` };
};

const truncateName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] ?? "Anonymous";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const getOwnerPublicName = async (ownerId?: Types.ObjectId): Promise<string | null> => {
  if (!ownerId) return null;
  const owner = await User.findById(ownerId).select("businessName fullName").lean();
  if (!owner) return null;
  return owner.businessName?.trim() || owner.fullName.split(" ")[0];
};

export const getPublicCollectionBySlug = async (slug: string) => {
  const collection = await Project.findOne({ slug, visibility: "public", status: { $in: ["active", "paused", "closed"] } })
    .select("-createdBy -rules")
    .lean();
  if (!collection) throw new AppError("Collection not found or no longer active.", 404, "COLLECTION_NOT_FOUND");

  const ownerName = await getOwnerPublicName(collection.ownerId);

  // Strip internal owner ID before returning
  const { ownerId: _ownerId, ...publicCollection } = collection;

  if (!collection.showContributors) return { ...publicCollection, ownerName };

  const recentPayments = await Payment.find({ projectId: collection._id, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(15)
    .select("customerName amount paidAt createdAt")
    .lean();

  const recentContributors = recentPayments.map((p) => ({
    name: truncateName(p.customerName ?? "Anonymous"),
    amount: p.amount,
    paidAt: p.paidAt ?? p.createdAt
  }));

  return { ...publicCollection, ownerName, recentContributors };
};

export const updateCollection = async (id: string, ownerId: Types.ObjectId, updates: Partial<CreateCollectionInput & { status: string }>) => {
  const collection = await Project.findOne({ _id: id, ownerId });
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");

  Object.assign(collection, {
    ...(updates.title && { title: updates.title }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.collectionType && { collectionType: updates.collectionType }),
    ...(updates.targetAmount !== undefined && { targetAmount: updates.targetAmount }),
    ...(updates.suggestedAmount !== undefined && { suggestedAmount: updates.suggestedAmount, monthlyContributionAmount: updates.suggestedAmount }),
    ...(updates.minimumAmount !== undefined && { minimumAmount: updates.minimumAmount }),
    ...(updates.currency && { currency: updates.currency }),
    ...(updates.allowCustomAmount !== undefined && { allowCustomAmount: updates.allowCustomAmount }),
    ...(updates.startDate && { startDate: parseDate(updates.startDate) }),
    ...(updates.endDate && { endDate: parseDate(updates.endDate) }),
    ...(updates.visibility && { visibility: updates.visibility }),
    ...(updates.coverImageUrl !== undefined && { coverImageUrl: updates.coverImageUrl }),
    ...(updates.paymentPurpose !== undefined && { paymentPurpose: updates.paymentPurpose }),
    ...(updates.thankYouMessage !== undefined && { thankYouMessage: updates.thankYouMessage }),
    ...(updates.showContributors !== undefined && { showContributors: updates.showContributors }),
    ...(updates.status && { status: updates.status })
  });

  return collection.save();
};

// Soft-close: sets status to "closed". No records are deleted.
// Permanent delete is a separate route if/when implemented.
export const closeCollection = async (id: string, ownerId: Types.ObjectId) => {
  const collection = await Project.findOne({ _id: id, ownerId });
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");
  collection.status = "closed";
  return collection.save();
};

export const getCollectionPayments = async (collectionId: string, ownerId: Types.ObjectId) => {
  const collection = await Project.findOne({ _id: collectionId, ownerId });
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");

  return Payment.find({ projectId: collectionId })
    .sort({ createdAt: -1 })
    .lean();
};

export const getCollectionSummary = async (collectionId: string, ownerId: Types.ObjectId) => {
  const collection = await Project.findOne({ _id: collectionId, ownerId }).lean();
  if (!collection) throw new AppError("Collection not found.", 404, "COLLECTION_NOT_FOUND");

  const [stats] = await Payment.aggregate([
    { $match: { projectId: collection._id, status: "completed" } },
    {
      $group: {
        _id: null,
        totalCollected: { $sum: "$amount" },
        contributorCount: { $sum: 1 },
        avgAmount: { $avg: "$amount" }
      }
    }
  ]);

  const recentPayments = await Payment.find({ projectId: collection._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const monthly = await Payment.aggregate([
    { $match: { projectId: collection._id, status: "completed" } },
    {
      $group: {
        _id: { $substr: ["$createdAt", 0, 7] },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  const totalCollected = stats?.totalCollected ?? 0;
  const progress = collection.targetAmount ? Math.min(100, Math.round((totalCollected / collection.targetAmount) * 100)) : 0;

  return {
    collection: { ...collection, publicPaymentLink: `${env.CLIENT_URL}/pay/${collection.slug}` },
    totalCollected,
    contributorCount: stats?.contributorCount ?? 0,
    avgAmount: stats?.avgAmount ?? 0,
    progress,
    recentPayments,
    monthlyChart: monthly.map((m) => ({ month: m._id, total: m.total, count: m.count }))
  };
};

export const refreshCollectionStats = async (projectId: Types.ObjectId) => {
  const [stats] = await Payment.aggregate([
    { $match: { projectId, status: "completed" } },
    { $group: { _id: null, totalCollected: { $sum: "$amount" }, contributorCount: { $sum: 1 } } }
  ]);
  await Project.updateOne(
    { _id: projectId },
    { totalCollected: stats?.totalCollected ?? 0, contributorCount: stats?.contributorCount ?? 0 }
  );
};
