import type { Request, Response } from "express";

import type MessageResponse from "../interfaces/message-response.js";

export const apiController = {
  index: (_req: Request, res: Response<MessageResponse>) => {
    res.json({
      message: "API - 👋🌎🌍🌏",
    });
  },
};
