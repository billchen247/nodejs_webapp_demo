import express from "express";

import apiRouter from "../api/index.js";
import { homeController } from "../controllers/home.controller.js";
import { todosRouter } from "./todos.js";

const router = express.Router();

router.get("/", homeController.index);
router.use("/api/v1", apiRouter);
router.use("/api/v1/todos", todosRouter);
export default router;
