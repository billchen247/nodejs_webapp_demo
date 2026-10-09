import express from "express";

import { apiController } from "../controllers/api.controller.js";
import emojis from "./emojis.js";

const router = express.Router();

router.get("/", apiController.index);
router.use("/emojis", emojis);

export default router;
