import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number."),
  password: z.string().min(1, "Password is required.")
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    phoneNumber: z.string().regex(/^\+?255\d{9}$|^0\d{9}$/, "Use a valid Tanzanian phone number."),
    email: z.string().email("Use a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const profileSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().regex(/^\+?255\d{9}$|^0\d{9}$/).optional().or(z.literal("")),
  email: z.string().email(),
  businessName: z.string().max(120).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url("Use a valid URL.").optional().or(z.literal(""))
});

export const projectSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(0),
  monthlyContributionAmount: z.coerce.number().min(500),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["active", "paused", "completed"])
});
