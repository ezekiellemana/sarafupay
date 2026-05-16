import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type UserRole = "member" | "admin";

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
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
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    isActive: { type: Boolean, default: true },
    businessName: { type: String, trim: true },
    bio: { type: String, maxlength: 300 },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);
