/* =============================================================================
 * src/routes/todos.ts — the /api/todos sub-router
 * =============================================================================
 *
 * A `Router` is a mini-Express application. We mount it in `app.ts` under
 * `/api/todos`. Keeping routes in their own module makes it easy to grow the
 * API: add `src/routes/users.ts`, mount it under `/api/users`, done.
 *
 * This file only cares about **URL path + verb → controller function**.
 * No business logic lives here. That's the controller's job.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { Router } from "express";
import {
    listTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo,
} from "../controllers/todos.js";

export const todosRouter = Router();

// Collection endpoints
todosRouter.get("/", listTodos);
todosRouter.post("/", createTodo);

// Single-resource endpoints
todosRouter.get("/:id", getTodo);
todosRouter.patch("/:id", updateTodo);
todosRouter.delete("/:id", deleteTodo);
