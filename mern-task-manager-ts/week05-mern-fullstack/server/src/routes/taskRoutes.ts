/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/src/routes/taskRoutes.ts
 *
 * Same shape as Week 2 — only the controller implementations changed.
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
