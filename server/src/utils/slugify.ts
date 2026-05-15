import crypto from "crypto";
import { Project } from "../models/Project.model";

export const slugify = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const generateUniqueSlug = async (title: string): Promise<string> => {
  const base = slugify(title) || "collection";
  let slug = base;
  for (let i = 0; i < 10; i++) {
    const existing = await Project.findOne({ slug });
    if (!existing) return slug;
    slug = `${base}-${crypto.randomBytes(2).toString("hex")}`;
  }
  return `${base}-${Date.now()}`;
};
