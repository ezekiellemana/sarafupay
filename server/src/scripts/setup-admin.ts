import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Intentionally does NOT call dotenv.config() — reads only from process.env
// so PowerShell env vars always win over any .env file.

const MONGO_URI = process.env.MONGO_URI;
const CURRENT_ADMIN_EMAIL = process.env.CURRENT_ADMIN_EMAIL; // email to find (old email)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;                 // email to set  (new/target email)
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PHONE || !ADMIN_PASSWORD) {
  console.error("Required: MONGO_URI, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD");
  console.error("Optional: CURRENT_ADMIN_EMAIL  (set this when changing from an old email)");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI as string);

  const lookupEmail = CURRENT_ADMIN_EMAIL ?? ADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD as string, 12);

  const result = await mongoose.connection.collection("users").findOneAndUpdate(
    { email: (lookupEmail as string).toLowerCase(), role: "admin" },
    {
      $set: {
        fullName: ADMIN_NAME as string,
        email: (ADMIN_EMAIL as string).toLowerCase(),
        phoneNumber: ADMIN_PHONE as string,
        passwordHash,
        role: "admin",
        isActive: true
      }
    },
    { returnDocument: "after" }
  );

  if (!result) {
    console.error(`No admin user found with email: ${lookupEmail}`);
    console.error("To create a new admin, omit CURRENT_ADMIN_EMAIL and use the seed script.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Admin updated: ${result.email} (role: ${result.role}, isActive: ${result.isActive})`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue ?? {}).join(", ");
    console.error(`Duplicate value conflict on field(s): ${key}`);
    console.error("Another user already has that email or phone number.");
  } else {
    console.error(err.message);
  }
  await mongoose.disconnect();
  process.exit(1);
});
