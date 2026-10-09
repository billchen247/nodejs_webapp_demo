import type { Request, Response } from "express";

import type MessageResponse from "../interfaces/message-response.js";

export const homeController = {
  index: (_req: Request, res: Response<MessageResponse>) => {
    res.json({
      message: "this is sec404 live demo. 🦄🌈✨👋🌎🌍🌏✨🌈🦄",
      documentation: "/api-docs",
    });
  },
};
