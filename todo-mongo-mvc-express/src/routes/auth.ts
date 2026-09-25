/* ---------------------------------------------------------------------------
 * src/routes/auth.ts
 *
 * Signup / login / logout. Kept at the top level so the URLs stay short:
 *
 *   GET  /signup            → signup form
 *   POST /signup            → create account + log in + redirect
 *   GET  /login             → login form
 *   POST /login             → verify credentials + log in + redirect
 *   POST /logout            → destroy session + redirect
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import {
    newSignupForm,
    createSignup,
    newLoginForm,
    createLogin,
    logout,
} from "../controllers/auth.js";

export const authRouter: Router = Router();

authRouter.get("/signup", newSignupForm);
authRouter.post("/signup", createSignup);
authRouter.get("/login", newLoginForm);
authRouter.post("/login", createLogin);
authRouter.post("/logout", logout);
