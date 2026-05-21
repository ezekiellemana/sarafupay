import crypto from "crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { setAuthCookie } from "../utils/cookieHelpers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// HMAC-signed stateless OAuth state — no cross-domain cookie required.
// Format (base64url): nonce.timestamp_b36.HMAC-SHA256(nonce.timestamp_b36, JWT_SECRET)
function generateOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now().toString(36);
  const payload = `${nonce}.${timestamp}`;
  const sig = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function verifyOAuthState(state: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot < 0) return false;
    const payload = decoded.slice(0, lastDot);
    const receivedSig = decoded.slice(lastDot + 1);
    const expectedSig = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
    // Constant-time comparison guards against timing attacks
    const recv = Buffer.from(receivedSig, "hex");
    const want = Buffer.from(expectedSig, "hex");
    if (recv.length !== want.length) return false;
    if (!crypto.timingSafeEqual(recv, want)) return false;
    const firstDot = payload.indexOf(".");
    if (firstDot < 0) return false;
    const timestamp = parseInt(payload.slice(firstDot + 1), 36);
    if (isNaN(timestamp) || Date.now() - timestamp > 5 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

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

  const state = generateOAuthState();

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

  // Verify HMAC-signed state (no cookie dependency — works across domains)
  if (!code || !state || !verifyOAuthState(state)) {
    console.error("[google_callback] state verification failed", {
      hasCode: !!code,
      hasState: !!state,
      error,
    });
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
    if (!tokens.access_token) {
      console.error("[google_callback] token exchange failed", { error: tokens.error });
      return redirectError("google_token_failed");
    }
    accessToken = tokens.access_token;
  } catch (err) {
    console.error("[google_callback] token fetch threw", err);
    return redirectError("google_token_failed");
  }

  // Fetch Google user profile
  let profile: GoogleProfile;
  try {
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profile = (await profileRes.json()) as GoogleProfile;
  } catch (err) {
    console.error("[google_callback] profile fetch threw", err);
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

  setAuthCookie(res, user._id.toString());

  const destination = user.role === "admin" ? "/admin" : "/dashboard";
  console.log(`[google_callback] auth success → ${destination} (role=${user.role}, id=${user._id.toString()})`);
  res.redirect(`${clientUrl}${destination}`);
});

