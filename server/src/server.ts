import { app } from "./app";
import { env } from "./config/env";
import { connectDb } from "./config/db";

const start = async () => {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`SarafuPay API running on port ${env.PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
