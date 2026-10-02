/**
 * @file src/routes/taskRoutes.js
 * @author Bill Chen
 * @description Week 10 — task routes now go through authenticate, then
 *   validators, then the write limiter on mutating endpoints.
 */

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { writeLimiter } from "../middleware/rateLimiters.js";
import { runValidators } from "../middleware/validate.js";
import {
  createTaskValidators,
  updateTaskValidators,
  idOnlyValidators,
} from "../validators/taskValidators.js";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = Router();

router.use(authenticate);

router.get("/", listTasks);
router.get("/:id", idOnlyValidators, runValidators, getTask);
router.post("/", writeLimiter, createTaskValidators, runValidators, createTask);
router.put(
  "/:id",
  writeLimiter,
  updateTaskValidators,
  runValidators,
  updateTask
);
router.delete(
  "/:id",
  writeLimiter,
  idOnlyValidators,
  runValidators,
  deleteTask
);

export default router;
