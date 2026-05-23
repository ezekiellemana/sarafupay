import { Router } from "express";
import {
  collectionActivityHandler,
  collectionPaymentsHandler,
  collectionSummaryHandler,
  createCollectionHandler,
  createCollectionSchema,
  closeCollectionHandler,
  exportCollectionCsvHandler,
  getCollectionHandler,
  myCollections,
  publicCollectionHandler,
  updateCollectionHandler,
  updateCollectionSchema
} from "../controllers/collection.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { publicCollectionLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Public route — must come before /:id to avoid conflict
router.get("/public/:slug", publicCollectionLimiter, publicCollectionHandler);

// Protected routes
router.get("/my", protect, myCollections);
// Must be before /:id to prevent Express treating "activity" as a collection ID
router.get("/activity", protect, collectionActivityHandler);
router.post("/", protect, validate(createCollectionSchema), createCollectionHandler);
router.get("/:id", protect, getCollectionHandler);
router.patch("/:id", protect, validate(updateCollectionSchema), updateCollectionHandler);
// Soft-close: sets status → "closed". No data is deleted. Permanent delete is a separate future route.
router.delete("/:id", protect, closeCollectionHandler);
router.get("/:id/payments", protect, collectionPaymentsHandler);
router.get("/:id/summary", protect, collectionSummaryHandler);
router.get("/:id/export/csv", protect, exportCollectionCsvHandler);

export default router;
