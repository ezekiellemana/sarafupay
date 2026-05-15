import { Router } from "express";
import { exportPaymentsCsv, members, payments, summary, unpaidMembers } from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect, requireAdmin);
router.get("/members", members);
router.get("/payments", payments);
router.get("/summary", summary);
router.get("/unpaid-members", unpaidMembers);
router.get("/export/payments", exportPaymentsCsv);

export default router;
