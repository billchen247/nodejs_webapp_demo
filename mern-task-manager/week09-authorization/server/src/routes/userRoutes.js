/**
 * @file src/routes/userRoutes.js
 * @author Bill Chen
 * @description User router — every endpoint requires an authenticated admin.
 */
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { listUsers, getUser } from "../controllers/userController.js";

const router = Router();

// Every endpoint under /api/users requires an admin.
router.use(authenticate, requireRole("admin"));

router.get("/", listUsers);
router.get("/:id", getUser);

export default router;
