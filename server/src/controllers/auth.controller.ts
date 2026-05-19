import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env";
import { User, type IUser } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { setAuthCookie, clearAuthCookie } from "../utils/cookieHelpers";

export const registerSchema = z
  .object({
    fullName: z.string().min(2),
    phoneNumber: z.string().regex(/^\+?255\d{9}$|^0\d{9}$/, "Use a valid Tanzanian phone number."),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match."
  });

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().regex(/^\+?255\d{9}$|^0\d{9}$/).optional(),
  email: z.string().email().optional(),
  businessName: z.string().max(120).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional().or(z.literal(""))
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const register = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, email, password } = req.body;
  const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phoneNumber }] });
  if (exists) throw new AppError("An account with this email or phone already exists.", 409, "USER_EXISTS");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ fullName, phoneNumber, email, passwordHash });
  setAuthCookie(res, user._id.toString());
  res.status(201).json({ success: true, message: "Account created successfully.", data: { user: serializeUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phoneNumber: identifier }]
  });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email/phone or password.", 401, "INVALID_CREDENTIALS");
  }
  if (!user.isActive) throw new AppError("This account is inactive.", 403, "ACCOUNT_INACTIVE");

  setAuthCookie(res, user._id.toString());
  res.json({ success: true, message: "Logged in successfully.", data: { user: serializeUser(user) } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out successfully.", data: {} });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: "Current user loaded.", data: { user: serializeUser(req.user!) } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user!._id, req.body, { returnDocument: "after", runValidators: true });
  res.json({ success: true, message: "Profile updated.", data: { user: serializeUser(user!) } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!._id);
  if (!user || !user.passwordHash || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw new AppError("Current password is incorrect.", 400, "PASSWORD_INCORRECT");
  }
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ success: true, message: "Password changed.", data: {} });
});

export const serializeUser = (user: IUser) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  phoneNumber: user.phoneNumber ?? null,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  businessName: user.businessName,
  bio: user.bio,
  avatarUrl: user.avatarUrl
});
