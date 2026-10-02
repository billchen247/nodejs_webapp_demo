/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/routes/authRoutes.ts
 *
 * New in Week 10:
 *   - `authLimiter` is attached once at the top. Every endpoint on this
 *     router is rate-limited — not just login. Register, forgot, and
 *     reset are the other high-value targets.
 *   - Each state-changing endpoint goes through `validateBody` with its
 *     zod schema. Validation is a layer, not a method call sprinkled
 *     through controllers.
 *   - `/refresh` and `/forgot-password` + `/reset-password` endpoints.
 */
import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/authSchemas.js";

const router = Router();

// Rate-limit the whole auth surface. These are the endpoints where a
// bad actor pays the smallest cost per attempt (just an HTTP request)
// and gets the biggest payoff (an account, a reset token, a session).
router.use(authLimiter);

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", me);
router.post("/refresh", refresh);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  resetPassword,
);

export default router;
