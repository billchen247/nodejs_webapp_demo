/**
 * @file src/routes/taskRoutes.js
 * @author Bill Chen
 * @description Task router. Every task route runs through `authenticate`
 *   first. If the request isn't authenticated, we respond 401 before the
 *   controller is called.
 */
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
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
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
