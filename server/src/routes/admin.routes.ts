import { Router } from "express";
import {
  activityFeed,
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
import {
  listAdminWithdrawalsHandler,
  getAdminWithdrawalHandler,
  approveWithdrawalHandler,
  rejectWithdrawalHandler,
  markProcessingHandler,
  markPaidHandler,
  markFailedHandler,
} from "../controllers/adminWithdrawal.controller";
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
router.get("/activity", activityFeed);
router.get("/settings", platformSettings);
router.get("/system-audit", systemAudit);

// Withdrawal management — admin only
router.get("/withdrawals",                       listAdminWithdrawalsHandler);
router.get("/withdrawals/:id",                   getAdminWithdrawalHandler);
router.patch("/withdrawals/:id/approve",         ...approveWithdrawalHandler);
router.patch("/withdrawals/:id/reject",          ...rejectWithdrawalHandler);
router.patch("/withdrawals/:id/mark-processing", markProcessingHandler);
router.patch("/withdrawals/:id/mark-paid",       ...markPaidHandler);
router.patch("/withdrawals/:id/mark-failed",     ...markFailedHandler);

export default router;
