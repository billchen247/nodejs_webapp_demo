import { Router } from "express";
import {
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} from "../controllers/projects.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", listProjects);
projectsRouter.post("/", createProject);
projectsRouter.get("/:id", getProject);
projectsRouter.patch("/:id", updateProject);
projectsRouter.delete("/:id", deleteProject);
