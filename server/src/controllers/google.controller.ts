import crypto from "crypto";
import type { Request, Response } from "express";
import { env, isProduction } from "../config/env";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { generateToken } from "../utils/generateToken";

const STATE_COOKIE = "sarafupay_oauth_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const stateCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 5 * 60 * 1000,
});

type GoogleProfile = {
  id?: string;
  email?: string;
  name?: string;
  verified_email?: boolean;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

export const googleRedirect = asyncHandler(async (_req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError("Google authentication is not configured.", 503, "GOOGLE_NOT_CONFIGURED");
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, stateCookieOptions());

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const clientUrl = env.CLIENT_URL;
  const redirectError = (code: string) => res.redirect(`${clientUrl}/login?error=${code}`);

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    return redirectError("google_not_configured");
  }

  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  // User cancelled or denied consent
  if (error) return redirectError("google_denied");

  // Verify CSRF state
  const storedState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, stateCookieOptions());

  if (!code || !state || !storedState || state !== storedState) {
    return redirectError("google_invalid_state");
  }

  // Exchange authorization code for access token
  let accessToken: string;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokens.access_token) return redirectError("google_token_failed");
    accessToken = tokens.access_token;
  } catch {
    return redirectError("google_token_failed");
  }

  // Fetch Google user profile
  let profile: GoogleProfile;
  try {
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profile = (await profileRes.json()) as GoogleProfile;
  } catch {
    return redirectError("google_profile_failed");
  }

  // Reject unverified or incomplete profiles
  if (!profile.id || !profile.email || !profile.verified_email) {
    return redirectError("google_unverified_email");
  }

  // Find existing user by googleId first, then fall back to email match
  let user = await User.findOne({
    $or: [{ googleId: profile.id }, { email: profile.email.toLowerCase() }],
  });

  if (user) {
    if (!user.isActive) return redirectError("account_inactive");
    // Link googleId to the existing account if not already linked
    if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
  } else {
    // Create a new member account from Google profile
    user = await User.create({
      fullName: profile.name ?? profile.email.split("@")[0],
      email: profile.email.toLowerCase(),
      googleId: profile.id,
      role: "member",
      isActive: true,
    });
  }

  // Set the same JWT cookie as normal login
  res.cookie(env.COOKIE_NAME, generateToken(user._id.toString()), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const destination = user.role === "admin" ? "/admin" : "/dashboard";
  res.redirect(`${clientUrl}${destination}`);
});

