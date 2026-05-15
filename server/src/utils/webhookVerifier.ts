import crypto from "crypto";
import { AppError } from "./AppError";

export const verifySnippeSignature = (
  rawBody: Buffer,
  signature: string | undefined,
  timestamp: string | undefined,
  secret: string
) => {
  if (!secret) throw new AppError("Webhook secret is not configured.", 500, "WEBHOOK_SECRET_MISSING");
  if (!signature || !timestamp) throw new AppError("Missing webhook signature headers.", 400, "WEBHOOK_HEADERS_MISSING");

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) throw new AppError("Invalid webhook timestamp.", 400, "WEBHOOK_TIMESTAMP_INVALID");

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > 300) throw new AppError("Webhook timestamp is too old.", 400, "WEBHOOK_REPLAY_REJECTED");

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const cleanSignature = signature.replace(/^sha256=/, "");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(cleanSignature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new AppError("Invalid webhook signature.", 400, "WEBHOOK_SIGNATURE_INVALID");
  }
};
