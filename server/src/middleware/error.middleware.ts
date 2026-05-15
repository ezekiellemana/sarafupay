import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { isProduction } from "../config/env";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const appError = err instanceof AppError ? err : new AppError("Something went wrong.", 500, "SERVER_ERROR");
  const payload: Record<string, unknown> = {
    success: false,
    message: appError.message,
    errorCode: appError.errorCode
  };

  if (!isProduction && !(err instanceof AppError)) {
    payload.stack = err.stack;
  }

  res.status(appError.statusCode).json(payload);
};
