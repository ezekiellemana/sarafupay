import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (userId: string) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
