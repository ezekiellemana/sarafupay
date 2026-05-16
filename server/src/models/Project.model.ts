import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type ProjectStatus = "draft" | "active" | "paused" | "completed" | "closed";

export type CollectionType =
  | "monthly_contribution"
  | "event"
  | "wedding"
  | "birthday"
  | "charity"
  | "emergency"
  | "school"
  | "church"
  | "mosque"
  | "trip"
  | "business"
  | "custom";

export interface IProject {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  title: string;
  slug?: string;
  description?: string;
  collectionType: CollectionType;
  targetAmount?: number;
  monthlyContributionAmount: number;
  suggestedAmount?: number;
  minimumAmount?: number;
  currency: string;
  allowCustomAmount: boolean;
  startDate?: Date;
  endDate?: Date;
  status: ProjectStatus;
  visibility: "public" | "private";
  coverImageUrl?: string;
  paymentPurpose?: string;
  thankYouMessage?: string;
  showContributors?: boolean;
  publicPaymentLink?: string;
  totalCollected: number;
  contributorCount: number;
  rules: string[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectDocument = HydratedDocument<IProject>;

const projectSchema = new Schema<IProject>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, default: "" },
    collectionType: {
      type: String,
      enum: ["monthly_contribution", "event", "wedding", "birthday", "charity", "emergency", "school", "church", "mosque", "trip", "business", "custom"],
      default: "monthly_contribution"
    },
    targetAmount: { type: Number, min: 0 },
    monthlyContributionAmount: { type: Number, default: 0, min: 0 },
    suggestedAmount: { type: Number, min: 0 },
    minimumAmount: { type: Number, min: 0 },
    currency: { type: String, default: "TZS" },
    allowCustomAmount: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["draft", "active", "paused", "completed", "closed"], default: "active" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    coverImageUrl: { type: String },
    paymentPurpose: { type: String },
    thankYouMessage: { type: String },
    showContributors: { type: Boolean, default: false },
    publicPaymentLink: { type: String },
    totalCollected: { type: Number, default: 0 },
    contributorCount: { type: Number, default: 0 },
    rules: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ slug: 1 }, { unique: true, sparse: true });
projectSchema.index({ ownerId: 1, status: 1 });
projectSchema.index({ visibility: 1, status: 1 });

export const Project = model<IProject>("Project", projectSchema);
