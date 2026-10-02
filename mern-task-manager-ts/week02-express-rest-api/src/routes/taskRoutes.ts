/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: src/routes/taskRoutes.ts
 *
 * One file per URL "neighbourhood" is a convention that scales well:
 *   /api/tasks/*  → this router
 *   /api/auth/*   → auth router (added in Week 6)
 *   /api/users/*  → users router (added in Week 9)
 *
 * The router does not know how to list or create a task — that is the
 * controller's job. The router just wires HTTP shapes to controller methods.
 */
import { Router } from "express";
import {
  addTask,
  editTask,
  listTasks,
  readTask,
  removeTask,
} from "../controllers/taskController.js";

const router = Router();

router.get("/", listTasks);
router.get("/:id", readTask);
router.post("/", addTask);
router.put("/:id", editTask);
router.delete("/:id", removeTask);

export default router;
