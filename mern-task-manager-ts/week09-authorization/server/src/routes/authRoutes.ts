/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/routes/authRoutes.ts
 */
import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);

export default router;
