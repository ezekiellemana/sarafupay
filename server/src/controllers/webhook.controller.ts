import { asyncHandler } from "../utils/asyncHandler";
import { handleSnippeWebhook } from "../services/payment.service";
import { verifyWebhookSignature } from "../services/snippe.service";

export const snippeWebhook = asyncHandler(async (req, res) => {
  verifyWebhookSignature(
    req.rawBody ?? Buffer.from(JSON.stringify(req.body)),
    req.header("X-Webhook-Signature") ?? undefined,
    req.header("X-Webhook-Timestamp") ?? undefined
  );
  await handleSnippeWebhook(req.body);
  res.status(200).json({ success: true, message: "Webhook processed.", data: {} });
});
