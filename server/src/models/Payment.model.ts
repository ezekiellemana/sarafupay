import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type PaymentStatus = "pending" | "completed" | "failed" | "expired" | "cancelled";

export interface IPayment {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  userId?: Types.ObjectId;
  payerUserId?: Types.ObjectId;
  projectId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  snippeReference?: string;
  snippeSessionId?: string;
  snippeCheckoutUrl?: string;
  snippePaymentLinkUrl?: string;
  externalReference: string;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  payerMessage?: string;
  monthPaidFor: string;
  metadata?: Record<string, unknown>;
  rawWebhookPayload?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;

const paymentSchema = new Schema<IPayment>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    payerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "TZS" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired", "cancelled"],
      default: "pending"
    },
    snippeReference: { type: String },
    snippeSessionId: { type: String },
    snippeCheckoutUrl: { type: String },
    snippePaymentLinkUrl: { type: String },
    externalReference: { type: String, required: true },
    paymentMethod: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    payerMessage: { type: String },
    monthPaidFor: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    rawWebhookPayload: { type: Schema.Types.Mixed },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, projectId: 1, monthPaidFor: 1, status: 1 });
paymentSchema.index({ ownerId: 1, status: 1 });
paymentSchema.index({ projectId: 1, status: 1 });
paymentSchema.index({ externalReference: 1 }, { unique: true });
paymentSchema.index({ snippeReference: 1 }, { unique: true, sparse: true });
paymentSchema.index({ snippeSessionId: 1 }, { sparse: true });

export const Payment = model<IPayment>("Payment", paymentSchema);
