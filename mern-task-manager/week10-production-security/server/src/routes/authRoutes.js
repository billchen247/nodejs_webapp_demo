/**
 * @file src/routes/authRoutes.js
 * @author Bill Chen
 * @description Auth router — register/login/logout/me/forgot/reset, each
 *   wired through the strict auth rate limiter and request validators.
 */
import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { runValidators } from "../middleware/validate.js";
import {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} from "../validators/authValidators.js";

const router = Router();

// Every mutating auth endpoint is behind the strict auth limiter.
// Login especially — this is what blunts online password guessing.
router.post("/register", authLimiter, registerValidators, runValidators, register);
router.post("/login", authLimiter, loginValidators, runValidators, login);
router.post("/logout", logout);
router.get("/me", me);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidators,
  runValidators,
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidators,
  runValidators,
  resetPassword
);

export default router;
