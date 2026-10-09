import type { Request, Response } from "express";

export const emojisController = {
  index: (_req: Request, res: Response<string[]>) => {
    res.json(["😀", "😳", "🙄", "🙄"]);
  },
};
