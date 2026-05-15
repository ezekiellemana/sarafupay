import bcrypt from "bcryptjs";
import { connectDb } from "../config/db";
import { env } from "../config/env";
import { Project } from "../models/Project.model";
import { User } from "../models/User.model";

const seed = async () => {
  await connectDb();

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_NAME || !env.ADMIN_PHONE) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD before seeding.");
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL },
    {
      fullName: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      phoneNumber: env.ADMIN_PHONE,
      passwordHash,
      role: "admin",
      isActive: true
    },
    { upsert: true, returnDocument: "after" }
  );

  await Project.findOneAndUpdate(
    { title: "Group Monthly Contribution" },
    {
      title: "Group Monthly Contribution",
      description: "Monthly contribution project for group members.",
      monthlyContributionAmount: 5000,
      targetAmount: 60000,
      currency: "TZS",
      status: "active",
      createdBy: admin._id,
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(new Date().getFullYear(), 11, 31)
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log("Seed complete.");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
