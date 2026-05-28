import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "failed"
  | "cancelled";

export type WithdrawalDestinationType = "mobile_money" | "bank";

export interface IWithdrawal {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  projectId: Types.ObjectId;

  requestedAmount: number;
  withdrawalFee: number;
  providerFee: number;
  totalDeducted: number;
  ownerReceives: number;
  currency: string;

  destinationType: WithdrawalDestinationType;
  recipientName: string;
  recipientPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;

  status: WithdrawalStatus;

  ownerNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  payoutReference?: string;

  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  paidBy?: Types.ObjectId;

  balanceSnapshot: {
    completedContributions: number;
    lockedWithdrawals: number;
    paidWithdrawals: number;
    availableForWithdrawal: number;
  };

  requestedAt: Date;
  approvedAt?: Date;
  processingAt?: Date;
  paidAt?: Date;
  rejectedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type WithdrawalDocument = HydratedDocument<IWithdrawal>;

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    ownerId:   { type: Schema.Types.ObjectId, ref: "User",    required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },

    requestedAmount: { type: Number, required: true, min: 1 },
    withdrawalFee:   { type: Number, required: true, min: 0 },
    providerFee:     { type: Number, required: true, min: 0 },
    totalDeducted:   { type: Number, required: true, min: 1 },
    ownerReceives:   { type: Number, required: true, min: 1 },
    currency:        { type: String, default: "TZS" },

    destinationType: {
      type: String,
      enum: ["mobile_money", "bank"],
      required: true,
    },
    recipientName:      { type: String, required: true, trim: true },
    recipientPhone:     { type: String, trim: true },
    bankName:           { type: String, trim: true },
    bankAccountNumber:  { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "approved", "processing", "paid", "rejected", "failed", "cancelled"],
      default: "pending",
    },

    ownerNote:       { type: String },
    adminNote:       { type: String },
    rejectionReason: { type: String },
    payoutReference: { type: String },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidBy:     { type: Schema.Types.ObjectId, ref: "User" },

    balanceSnapshot: {
      completedContributions: { type: Number, required: true },
      lockedWithdrawals:      { type: Number, required: true },
      paidWithdrawals:        { type: Number, required: true },
      availableForWithdrawal: { type: Number, required: true },
    },

    requestedAt:  { type: Date, default: () => new Date() },
    approvedAt:   { type: Date },
    processingAt: { type: Date },
    paidAt:       { type: Date },
    rejectedAt:   { type: Date },
    failedAt:     { type: Date },
    cancelledAt:  { type: Date },
  },
  { timestamps: true },
);

withdrawalSchema.index({ ownerId: 1, status: 1 });
withdrawalSchema.index({ projectId: 1, status: 1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });
withdrawalSchema.index({ payoutReference: 1 }, { unique: true, sparse: true });
withdrawalSchema.index({ ownerId: 1, createdAt: -1 });

export const Withdrawal = model<IWithdrawal>("Withdrawal", withdrawalSchema);
