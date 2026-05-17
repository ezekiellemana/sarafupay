import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// No dotenv.config() — reads only from process.env (PowerShell vars always win).
// Upserts the admin user, then immediately re-fetches and verifies bcrypt.compare.
// Prints cluster host so you can confirm this is Atlas, not localhost.

const MONGO_URI     = process.env.MONGO_URI;
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL;
const ADMIN_NAME    = process.env.ADMIN_NAME;
const ADMIN_PHONE   = process.env.ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PHONE || !ADMIN_PASSWORD) {
  console.error("Required env vars: MONGO_URI  ADMIN_EMAIL  ADMIN_NAME  ADMIN_PHONE  ADMIN_PASSWORD");
  process.exit(1);
}

// Extract host from URI without printing the password.
const clusterHost = (() => {
  try {
    return new URL(MONGO_URI!.replace("mongodb+srv://", "https://")).hostname;
  } catch {
    return "(could not parse)";
  }
})();

const run = async () => {
  await mongoose.connect(MONGO_URI as string);
  const db = mongoose.connection.db!;

  console.log("\n=== Connection ===");
  console.log(`Cluster  : ${clusterHost}`);
  console.log(`Database : ${db.databaseName}`);

  const email    = (ADMIN_EMAIL   as string).toLowerCase().trim();
  const name     = (ADMIN_NAME    as string).trim();
  const phone    = (ADMIN_PHONE   as string).trim();
  const password = ADMIN_PASSWORD as string;

  const passwordHash = await bcrypt.hash(password, 12);

  await db.collection("users").findOneAndUpdate(
    { email },
    {
      $set: {
        fullName: name,
        email,
        phoneNumber: phone,
        passwordHash,
        role: "admin",
        isActive: true
      }
    },
    { upsert: true }
  );

  // Re-fetch what is actually stored — never trust the write return value alone.
  const stored = await db.collection("users").findOne(
    { email },
    { projection: { email: 1, fullName: 1, phoneNumber: 1, role: 1, isActive: 1, passwordHash: 1 } }
  );

  console.log("\n=== Stored document ===");
  if (!stored) {
    console.error("FAIL: document not found after upsert. Check database name and Atlas permissions.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`email       : ${stored.email}`);
  console.log(`fullName    : ${stored.fullName}`);
  console.log(`phoneNumber : ${stored.phoneNumber}`);
  console.log(`role        : ${stored.role}`);
  console.log(`isActive    : ${stored.isActive}`);
  console.log(`hash length : ${(stored.passwordHash as string)?.length ?? 0} chars`);

  const match = await bcrypt.compare(password, stored.passwordHash as string);

  console.log("\n=== Verification ===");
  console.log(`bcrypt.compare : ${match ? "MATCH ✓" : "NO MATCH ✗"}`);

  const roleOk   = stored.role === "admin";
  const activeOk = stored.isActive === true;

  if (match && roleOk && activeOk) {
    console.log("\nAdmin ready:");
    console.log(`  email    : ${stored.email}`);
    console.log(`  role     : ${stored.role}`);
    console.log(`  isActive : ${stored.isActive}`);
    console.log(`  password : MATCH — login will work`);
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!match)    console.error("Password mismatch — set ADMIN_PASSWORD to the exact string you will type in the browser.");
  if (!roleOk)   console.error(`Role is "${stored.role}", expected "admin".`);
  if (!activeOk) console.error("isActive is false — login will return 403, not 401.");

  await mongoose.disconnect();
  process.exit(1);
};

run().catch(async (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {}).join(", ");
    console.error(`\nDuplicate key conflict on: ${field}`);
    console.error("Another user already has that email or phone number.");
    console.error("Use a different ADMIN_PHONE that is not taken by any member account.");
  } else {
    console.error(`\n${err.message}`);
  }
  await mongoose.disconnect();
  process.exit(1);
});
