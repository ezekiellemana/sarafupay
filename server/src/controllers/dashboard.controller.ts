import { asyncHandler } from "../utils/asyncHandler";
import { getAdminDashboard, getMemberDashboard } from "../services/dashboard.service";

export const memberDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getMemberDashboard(req.user!._id);
  res.json({ success: true, message: "Dashboard loaded.", data: dashboard });
});

export const adminDashboard = asyncHandler(async (_req, res) => {
  const dashboard = await getAdminDashboard();
  res.json({ success: true, message: "Admin dashboard loaded.", data: dashboard });
});
