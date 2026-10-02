/**
 * @file src/routes/authRoutes.js
 * @author Bill Chen
 * @description Routes for register / login / logout / me.
 */

import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);

export default router;
