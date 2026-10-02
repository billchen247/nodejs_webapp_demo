/**
 * @file src/routes/authRoutes.js
 * @author Bill Chen
 * @description Auth router — maps URL + method to an auth controller function.
 */
import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);

export default router;
