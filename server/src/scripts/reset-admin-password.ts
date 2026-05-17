import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Intentionally does NOT call dotenv.config() — reads only from process.env
// so PowerShell env vars always win over any .env file.
// Use NEW_ADMIN_PASSWORD (not ADMIN_PASSWORD) to avoid collision with .env values.

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const NEW_ADMIN_PASSWORD = process.env.NEW_ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_EMAIL || !NEW_ADMIN_PASSWORD) {
  console.error("Required: MONGO_URI, ADMIN_EMAIL, NEW_ADMIN_PASSWORD");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI as string);

  const passwordHash = await bcrypt.hash(NEW_ADMIN_PASSWORD as string, 12);

  const result = await mongoose.connection.collection("users").findOneAndUpdate(
    { email: (ADMIN_EMAIL as string).toLowerCase(), role: "admin" },
    { $set: { passwordHash } },
    { returnDocument: "after" }
  );

  if (!result) {
    console.error(`No admin user found with email: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Password reset complete for: ${result.email} (role: ${result.role})`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
