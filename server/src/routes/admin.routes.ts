import { Router } from "express";
import {
  exportPaymentsCsv,
  getMember,
  members,
  payments,
  summary,
  unpaidMembers,
  updateMemberStatus,
} from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect, requireAdmin);
router.get("/members", members);
router.get("/members/:id", getMember);
router.patch("/members/:id/status", updateMemberStatus);
router.get("/payments", payments);
router.get("/summary", summary);
router.get("/unpaid-members", unpaidMembers);
router.get("/export/payments", exportPaymentsCsv);

export default router;
