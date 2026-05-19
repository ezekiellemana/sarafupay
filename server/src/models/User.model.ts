import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type UserRole = "member" | "admin";

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  phoneNumber?: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  isActive: boolean;
  businessName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: false, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    isActive: { type: Boolean, default: true },
    businessName: { type: String, trim: true },
    bio: { type: String, maxlength: 300 },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

export const User = model<IUser>("User", userSchema);
