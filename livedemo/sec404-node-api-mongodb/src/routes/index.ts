import express from "express";

import apiRouter from "../api/index.js";
import { homeController } from "../controllers/home.controller.js";

const router = express.Router();

router.get("/", homeController.index);
router.use("/api/v1", apiRouter);

export default router;
