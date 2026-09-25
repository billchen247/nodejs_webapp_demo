/* ---------------------------------------------------------------------------
 * src/routes/projects.ts
 *
 *   GET    /projects              → index (all projects, filterable ?scope=mine)
 *   GET    /projects/new          → new form
 *   POST   /projects              → create
 *   GET    /projects/:id          → show (with kanban board of tasks)
 *   GET    /projects/:id/edit     → edit form
 *   PUT    /projects/:id          → update
 *   DELETE /projects/:id          → destroy (cascade-deletes tasks)
 *
 * Nested tasks router:
 *   /projects/:projectId/tasks/… → src/routes/tasks.ts
 *
 * `requireAuth` applies to the whole subtree — no anonymous access.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    listProjects,
    newProjectForm,
    createProject,
    showProject,
    editProjectForm,
    updateProject,
    deleteProject,
} from "../controllers/projects.js";
import { tasksRouter } from "./tasks.js";

export const projectsRouter: Router = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", listProjects);
projectsRouter.get("/new", newProjectForm);
projectsRouter.post("/", createProject);
projectsRouter.get("/:id", showProject);
projectsRouter.get("/:id/edit", editProjectForm);
projectsRouter.put("/:id", updateProject);
projectsRouter.delete("/:id", deleteProject);

// Nested resource — `mergeParams: true` on the child router exposes :id here
// as :projectId inside the task routes.
projectsRouter.use("/:projectId/tasks", tasksRouter);
