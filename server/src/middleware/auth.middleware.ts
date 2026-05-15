import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

type TokenPayload = { id: string };

export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");

  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");

  req.user = user;
  next();
});
