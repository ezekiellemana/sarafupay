import { Router } from "express";
import { snippeWebhook } from "../controllers/webhook.controller";

const router = Router();

router.post("/snippe", snippeWebhook);

export default router;
