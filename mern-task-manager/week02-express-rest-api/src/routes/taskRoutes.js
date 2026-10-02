/**
 * @file src/routes/taskRoutes.js
 * @author Bill Chen
 * @description Task router.
 *
 * This file is just a map from (URL + HTTP method) to a controller
 * function. Keeping routes and controllers in separate files is a
 * common REST convention — the route file reads like a table of contents.
 */
import { Router } from "express";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = Router();

// GET /api/tasks         → list every task
router.get("/", listTasks);
// GET /api/tasks/:id     → fetch a single task
router.get("/:id", getTask);
// POST /api/tasks        → create a new task
router.post("/", createTask);
// PUT /api/tasks/:id     → update an existing task
router.put("/:id", updateTask);
// DELETE /api/tasks/:id  → remove a task
router.delete("/:id", deleteTask);

export default router;
