/**
 * @file src/routes/taskRoutes.js
 * @author Bill Chen
 * @description Task router — maps URL + method to a controller function.
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

router.get("/", listTasks);
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
