/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/routes/taskRoutes.ts
 *
 * Every task route is wrapped in `requireAuth`. Attaching the middleware
 * once at the top with `router.use(requireAuth)` means the next person
 * who adds a route to this file cannot accidentally forget to protect it.
 */
import { Router } from "express";
import { requireAuth } from "../auth/requireAuth.js";
import {
  addTask,
  editTask,
  listTasks,
  readTask,
  removeTask,
} from "../controllers/taskController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listTasks);
router.post("/", addTask);
router.get("/:id", readTask);
router.put("/:id", editTask);
router.delete("/:id", removeTask);

export default router;
