import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Intentionally does NOT call dotenv.config() — reads only from process.env.
// Prints diagnostic info. Never prints passwordHash or the supplied password.

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const NEW_ADMIN_PASSWORD = process.env.NEW_ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_EMAIL || !NEW_ADMIN_PASSWORD) {
  console.error("Required: MONGO_URI, ADMIN_EMAIL, NEW_ADMIN_PASSWORD");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI as string);

  const db = mongoose.connection.db!;
  console.log("\n=== Connection ===");
  console.log(`Database name : ${db.databaseName}`);

  const collections = await db.listCollections().toArray();
  console.log(`Collections   : ${collections.map((c) => c.name).join(", ") || "(none)"}`);

  console.log("\n=== User lookup ===");
  const user = await db.collection("users").findOne(
    { email: (ADMIN_EMAIL as string).toLowerCase() },
    { projection: { email: 1, fullName: 1, phoneNumber: 1, role: 1, isActive: 1, passwordHash: 1 } }
  );

  if (!user) {
    console.error(`NOT FOUND: no user with email "${ADMIN_EMAIL}" in ${db.databaseName}.users`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`email         : ${user.email}`);
  console.log(`fullName      : ${user.fullName}`);
  console.log(`phoneNumber   : ${user.phoneNumber}`);
  console.log(`role          : ${user.role}`);
  console.log(`isActive      : ${user.isActive}`);
  console.log(`passwordHash  : [present=${!!user.passwordHash}, length=${(user.passwordHash as string)?.length ?? 0}]`);

  console.log("\n=== Password check ===");
  if (!user.passwordHash) {
    console.error("FAIL: passwordHash field is missing or empty");
    await mongoose.disconnect();
    process.exit(1);
  }

  const matches = await bcrypt.compare(NEW_ADMIN_PASSWORD as string, user.passwordHash as string);
  console.log(`bcrypt.compare: ${matches ? "MATCH ✓" : "NO MATCH ✗"}`);

  if (!matches) {
    console.error("\nDiagnosis: password stored does not match NEW_ADMIN_PASSWORD.");
    console.error("Re-run setup-admin with the exact same value you are trying to log in with.");
  }

  if (user.role !== "admin") {
    console.error(`\nDiagnosis: role is "${user.role}", not "admin". Login will succeed but admin routes will 403.`);
  }

  if (!user.isActive) {
    console.error("\nDiagnosis: isActive is false. Login returns 403 ACCOUNT_INACTIVE, not 401.");
  }

  await mongoose.disconnect();
  process.exit(matches ? 0 : 1);
};

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
