import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Intentionally does NOT call dotenv.config() — reads only from process.env
// so PowerShell env vars always win over any .env file.
//
// Without CURRENT_ADMIN_EMAIL: upserts by ADMIN_EMAIL (create or update).
// With CURRENT_ADMIN_EMAIL:    finds by old email, updates to new email (email rename).

const MONGO_URI = process.env.MONGO_URI;
const CURRENT_ADMIN_EMAIL = process.env.CURRENT_ADMIN_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PHONE || !ADMIN_PASSWORD) {
  console.error("Required: MONGO_URI, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD");
  console.error("Optional: CURRENT_ADMIN_EMAIL (only needed when renaming an existing admin email)");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI as string);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD as string, 12);
  const targetEmail = (ADMIN_EMAIL as string).toLowerCase();

  let result: Record<string, unknown> | null;

  if (CURRENT_ADMIN_EMAIL) {
    // Rename mode: find by old email + admin role, update to new email.
    result = await mongoose.connection.collection("users").findOneAndUpdate(
      { email: CURRENT_ADMIN_EMAIL.toLowerCase(), role: "admin" },
      {
        $set: {
          fullName: ADMIN_NAME as string,
          email: targetEmail,
          phoneNumber: ADMIN_PHONE as string,
          passwordHash,
          role: "admin",
          isActive: true
        }
      },
      { returnDocument: "after" }
    ) as Record<string, unknown> | null;

    if (!result) {
      console.error(`No admin found with email: ${CURRENT_ADMIN_EMAIL}`);
      await mongoose.disconnect();
      process.exit(1);
    }
  } else {
    // Upsert mode: create admin if not found, update if found (matched by email only).
    result = await mongoose.connection.collection("users").findOneAndUpdate(
      { email: targetEmail },
      {
        $set: {
          fullName: ADMIN_NAME as string,
          email: targetEmail,
          phoneNumber: ADMIN_PHONE as string,
          passwordHash,
          role: "admin",
          isActive: true
        }
      },
      { upsert: true, returnDocument: "after" }
    ) as Record<string, unknown>;
  }

  const action = CURRENT_ADMIN_EMAIL ? "updated" : "upserted";
  console.log(`Admin ${action}: ${result.email} (role: ${result.role}, isActive: ${result.isActive})`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue ?? {}).join(", ");
    console.error(`Duplicate conflict on: ${key} — another user already has that value.`);
  } else {
    console.error(err.message);
  }
  await mongoose.disconnect();
  process.exit(1);
});
