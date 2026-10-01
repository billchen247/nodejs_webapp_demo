/* ---------------------------------------------------------------------------
 * src/routes/tasks.ts
 *
 * The Express router for the /api/tasks resource. Same declarative table of
 * intent as its sister project — Zod validation as a middleware, controllers
 * as bare async functions:
 *
 *     GET    /            -> validate query   -> listTasks
 *     POST   /            -> validate body    -> createTask
 *     GET    /:id         -> validate params  -> getTaskById
 *     PUT    /:id         -> validate params+body -> updateTask
 *     DELETE /:id         -> validate params  -> deleteTask
 *
 * This router is mounted at /api/tasks in src/app.ts.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import * as tasks from "../controllers/tasks.js";
import { validate } from "../middleware/validate.js";
import {
    CreateTaskSchema,
    TaskIdParamSchema,
    TaskListQuerySchema,
    UpdateTaskSchema,
} from "../schemas/tasks.js";

export const tasksRouter = Router();

// Collection: /api/tasks
tasksRouter
    .route("/")
    .get(validate({ query: TaskListQuerySchema }), tasks.listTasks)
    .post(validate({ body: CreateTaskSchema }), tasks.createTask);

// Single item: /api/tasks/:id
tasksRouter
    .route("/:id")
    .get(validate({ params: TaskIdParamSchema }), tasks.getTaskById)
    .put(
        validate({ params: TaskIdParamSchema, body: UpdateTaskSchema }),
        tasks.updateTask
    )
    .delete(validate({ params: TaskIdParamSchema }), tasks.deleteTask);
