/**
 * One-time migration: convert the phoneNumber index from unique (non-sparse)
 * to unique + sparse so that Google OAuth users without a phone number can
 * coexist in the collection.
 *
 * Safe to run on a live database — existing users are unchanged.
 * Run once before deploying the Google OAuth feature:
 *
 *   npm run fix-phone-index
 */
import mongoose from "mongoose";
import { env } from "../config/env";

async function run() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(env.MONGO_URI);
  const db = mongoose.connection.db!;
  const col = db.collection("users");

  const indexes = await col.indexes();
  console.log(
    "Current indexes on users collection:\n",
    indexes.map((i) => `  ${i.name}: ${JSON.stringify(i.key)} unique=${i.unique} sparse=${i.sparse}`).join("\n")
  );

  const phoneIndex = indexes.find(
    (i) => i.key?.phoneNumber === 1 && i.unique === true && !i.sparse
  );

  if (!phoneIndex) {
    console.log("\nphoneNumber index is already sparse (or absent). Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const indexName = phoneIndex.name as string;
  console.log(`\nDropping non-sparse index "${indexName}"…`);
  await col.dropIndex(indexName);

  console.log("Recreating as unique + sparse…");
  await col.createIndex(
    { phoneNumber: 1 },
    { unique: true, sparse: true, background: true, name: "phoneNumber_1" }
  );

  console.log("Done. phoneNumber index is now unique + sparse.");

  // Verify
  const updated = await col.indexes();
  const newIdx = updated.find((i) => i.key?.phoneNumber === 1);
  console.log("Updated index:", JSON.stringify(newIdx));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
