import { Router } from "express";
import { createProject, deleteProject, getProject, listProjects, projectSchema, updateProject } from "../controllers/project.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.get("/", protect, listProjects);
router.get("/:id", protect, getProject);
router.post("/", protect, requireAdmin, validate(projectSchema), createProject);
router.patch("/:id", protect, requireAdmin, validate(projectSchema.partial()), updateProject);
router.delete("/:id", protect, requireAdmin, deleteProject);

export default router;
