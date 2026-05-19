import type { Response } from "express";
import { env, isProduction } from "../config/env";
import { generateToken } from "./generateToken";

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE = 5 * 60 * 1000;
export const OAUTH_STATE_COOKIE = "sarafupay_oauth_state";

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

export const setOAuthStateCookie = (res: Response, state: string): void => {
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...baseCookieOptions(),
    maxAge: OAUTH_STATE_MAX_AGE,
  });
};

export const clearOAuthStateCookie = (res: Response): void => {
  res.clearCookie(OAUTH_STATE_COOKIE, baseCookieOptions());
};
