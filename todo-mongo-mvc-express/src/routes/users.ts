/* ---------------------------------------------------------------------------
 * src/routes/users.ts
 *
 *   GET  /users                → directory of everyone
 *   GET  /users/me/edit        → my profile edit form
 *   PUT  /users/me             → update my name/email
 *   POST /users/me/password    → change my password
 *   GET  /users/:id            → someone's public-ish profile
 *
 * IMPORTANT: `/users/me/…` MUST be declared before `/users/:id` or Express
 * treats "me" as an ID.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    listUsers,
    showUser,
    editMeForm,
    updateMe,
    changeMyPassword,
} from "../controllers/users.js";

export const usersRouter: Router = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", listUsers);
usersRouter.get("/me/edit", editMeForm);
usersRouter.put("/me", updateMe);
usersRouter.post("/me/password", changeMyPassword);
usersRouter.get("/:id", showUser);
