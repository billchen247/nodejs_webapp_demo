/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/routes/userRoutes.ts
 *
 * Admin-only routes.
 *
 * Both middlewares are attached once at the top via `router.use(...)` so
 * that *every* route on this router is protected. The next person to
 * add a route cannot forget to add the guards — a very common mistake.
 */
import { Router } from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { requireRole } from "../auth/requireRole.js";
import { listUsers, readUser, updateUserRole } from "../controllers/userController.js";

const router = Router();

// Chain: authenticate first, then authorize. The order matters — an
// unauthenticated request should get 401, not 403.
router.use(requireAuth, requireRole("admin"));

router.get("/", listUsers);
router.get("/:id", readUser);
router.patch("/:id", updateUserRole);

export default router;
