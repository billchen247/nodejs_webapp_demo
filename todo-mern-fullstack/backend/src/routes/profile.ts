import { Router } from "express";
import { getProfile } from "../controllers/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, getProfile);
