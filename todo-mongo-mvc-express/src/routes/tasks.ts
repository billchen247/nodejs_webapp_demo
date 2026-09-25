/* ---------------------------------------------------------------------------
 * src/routes/tasks.ts
 *
 * Tasks are nested under a project — every route starts with
 * `/projects/:projectId`. Mounted onto the projects router with
 * `mergeParams: true` so the `projectId` param is visible to the task
 * controllers.
 *
 *   GET    /projects/:projectId/tasks/new             → new form
 *   POST   /projects/:projectId/tasks                 → create
 *   GET    /projects/:projectId/tasks/:id             → show
 *   GET    /projects/:projectId/tasks/:id/edit        → edit form
 *   PUT    /projects/:projectId/tasks/:id             → update
 *   POST   /projects/:projectId/tasks/:id/status      → change status (board)
 *   DELETE /projects/:projectId/tasks/:id             → destroy
 *
 * There's deliberately no `GET /projects/:projectId/tasks` (index) — the
 * project's own `show` page already renders the kanban board.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import {
    newTaskForm,
    createTask,
    showTask,
    editTaskForm,
    updateTask,
    changeStatus,
    deleteTask,
} from "../controllers/tasks.js";

export const tasksRouter: Router = Router({ mergeParams: true });

tasksRouter.get("/new", newTaskForm);
tasksRouter.post("/", createTask);
tasksRouter.get("/:id", showTask);
tasksRouter.get("/:id/edit", editTaskForm);
tasksRouter.put("/:id", updateTask);
tasksRouter.post("/:id/status", changeStatus);
tasksRouter.delete("/:id", deleteTask);
