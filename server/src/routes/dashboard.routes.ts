import { Router } from "express";
import { adminDashboard, memberDashboard } from "../controllers/dashboard.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/member", protect, memberDashboard);
router.get("/admin", protect, requireAdmin, adminDashboard);

export default router;
