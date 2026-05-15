import { Router } from "express";
import {
  collectionPaymentsHandler,
  collectionSummaryHandler,
  createCollectionHandler,
  createCollectionSchema,
  deleteCollectionHandler,
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
router.post("/", protect, validate(createCollectionSchema), createCollectionHandler);
router.get("/:id", protect, getCollectionHandler);
router.patch("/:id", protect, validate(updateCollectionSchema), updateCollectionHandler);
router.delete("/:id", protect, deleteCollectionHandler);
router.get("/:id/payments", protect, collectionPaymentsHandler);
router.get("/:id/summary", protect, collectionSummaryHandler);
router.get("/:id/export/csv", protect, exportCollectionCsvHandler);

export default router;
