import type { RequestHandler } from "express";
import mongoSanitize from "express-mongo-sanitize";

const sanitizeObject = (value: unknown) => {
  if (value && typeof value === "object") {
    mongoSanitize.sanitize(value as Record<string, unknown> | unknown[]);
  }
};

export const sanitizeRequest: RequestHandler = (req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};
