import express from "express";

import { emojisController } from "../controllers/emojis.controller.js";

const router = express.Router();

router.get("/", emojisController.index);

export default router;
