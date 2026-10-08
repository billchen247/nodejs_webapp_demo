import express from "express";

import type MessageResponse from "../interfaces/message-response.js";

import emojis from "./emojis.js";
import projects from "./projects.js";
import todos from "./todos.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (_req, res) => {
  res.json({
    message: "hello world API in sec403 live demo - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/projects", projects);
router.use("/todos", todos);

export default router;
