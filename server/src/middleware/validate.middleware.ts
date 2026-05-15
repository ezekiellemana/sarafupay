import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export const validate =
  (schema: ZodSchema, source: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }
    if (source === "query") {
      Object.keys(req.query).forEach((key) => {
        delete req.query[key];
      });
      Object.assign(req.query, result.data);
    } else {
      req[source] = result.data;
    }
    return next();
  };
