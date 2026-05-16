import { Router } from "express";
import { snippeWebhook } from "../controllers/webhook.controller";
import { webhookLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/snippe", webhookLimiter, snippeWebhook);

export default router;
