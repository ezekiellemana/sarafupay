import { Router } from "express";
import { changePassword, changePasswordSchema, login, loginSchema, logout, me, profileSchema, register, registerSchema, updateProfile } from "../controllers/auth.controller";
import { googleCallback, googleRedirect } from "../controllers/google.controller";
import { protect } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);
router.post("/logout", logout);
router.get("/me", protect, me);
router.patch("/profile", protect, validate(profileSchema), updateProfile);
router.patch("/change-password", protect, validate(changePasswordSchema), changePassword);

export default router;
