/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/routes/taskRoutes.ts
 *
 * New in Week 10:
 *   - `createTaskSchema` and `updateTaskSchema` enforce shape and
 *     bounds *before* a controller runs. The controller no longer has
 *     to defensively re-type fields from `req.body`.
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
import { validateBody } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/taskSchemas.js";

const router = Router();

router.use(requireAuth);

router.get("/", listTasks);
router.post("/", validateBody(createTaskSchema), addTask);
router.get("/:id", readTask);
router.put("/:id", validateBody(updateTaskSchema), editTask);
router.delete("/:id", removeTask);

export default router;
