import express from "express";

import * as projectsController from "../controllers/projects.js";

const router = express.Router();

router
  .route("/")
  .get(projectsController.listProjects)
  .post(projectsController.createProject);

router
  .route("/:id")
  .get(projectsController.getProject)
  .put(projectsController.replaceProject)
  .patch(projectsController.updateProject)
  .delete(projectsController.deleteProject);

export default router;
