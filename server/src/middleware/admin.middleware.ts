import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access required.", 403, "ADMIN_REQUIRED"));
  }
  return next();
};
