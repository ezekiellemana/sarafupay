import { Router } from "express";
import {
  exportPaymentsCsv,
  getAdminCollection,
  getAdminCollections,
  getAdminPayment,
  getMember,
  members,
  payments,
  platformSettings,
  summary,
  systemAudit,
  unpaidMembers,
  updateAdminCollectionStatus,
  updateMemberStatus,
} from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect, requireAdmin);
router.get("/members", members);
router.get("/members/:id", getMember);
router.patch("/members/:id/status", updateMemberStatus);
router.get("/collections", getAdminCollections);
router.get("/collections/:id", getAdminCollection);
router.patch("/collections/:id/status", updateAdminCollectionStatus);
router.get("/payments", payments);
router.get("/payments/:id", getAdminPayment);
router.get("/summary", summary);
router.get("/unpaid-members", unpaidMembers);
router.get("/export/payments", exportPaymentsCsv);
router.get("/settings", platformSettings);
router.get("/system-audit", systemAudit);

export default router;
