import { z } from "zod";
import { Project } from "../models/Project.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const projectSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(0).optional(),
  monthlyContributionAmount: z.coerce.number().min(500).default(5000),
  currency: z.string().default("TZS"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  rules: z.array(z.string()).optional()
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, message: "Project created.", data: { project } });
});

export const listProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json({ success: true, message: "Projects loaded.", data: { projects } });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  res.json({ success: true, message: "Project loaded.", data: { project } });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true });
  if (!project) throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  res.json({ success: true, message: "Project updated.", data: { project } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  res.json({ success: true, message: "Project deleted.", data: {} });
});
