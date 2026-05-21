import type { Response } from "express";
import { env, isProduction } from "../config/env";
import { generateToken } from "./generateToken";

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
});

export const setAuthCookie = (res: Response, userId: string): void => {
  res.cookie(env.COOKIE_NAME, generateToken(userId), {
    ...baseCookieOptions(),
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(env.COOKIE_NAME, baseCookieOptions());
};
