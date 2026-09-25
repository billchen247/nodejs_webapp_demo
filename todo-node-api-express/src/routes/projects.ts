import { Router } from "express";
import * as projects from "../controllers/projects.js";
import { validate } from "../middleware/validate.js";
import {
    CreateProjectSchema,
    ProjectIdParamSchema,
    UpdateProjectSchema,
} from "../schemas/projects.js";

export const projectsRouter = Router();

projectsRouter
    .route("/")
    .get(projects.listProjects)
    .post(validate({ body: CreateProjectSchema }), projects.createProject);

projectsRouter
    .route("/:id")
    .get(validate({ params: ProjectIdParamSchema }), projects.getProjectById)
    .put(
        validate({ params: ProjectIdParamSchema, body: UpdateProjectSchema }),
        projects.updateProject
    )
    .delete(validate({ params: ProjectIdParamSchema }), projects.deleteProject);