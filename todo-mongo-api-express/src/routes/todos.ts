/* ---------------------------------------------------------------------------
 * src/routes/todos.ts
 *
 * The Express router for the /api/todos resource. Same declarative table of
 * intent as its sister project — Zod validation as a middleware, controllers
 * as bare async functions:
 *
 *     GET    /            -> validate query   -> listTodos
 *     POST   /            -> validate body    -> createTodo
 *     GET    /:id         -> validate params  -> getTodoById
 *     PUT    /:id         -> validate params+body -> updateTodo
 *     DELETE /:id         -> validate params  -> deleteTodo
 *
 * This router is mounted at /api/todos in src/app.ts.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import * as todos from "../controllers/todos.js";
import { validate } from "../middleware/validate.js";
import {
    CreateTodoSchema,
    TodoIdParamSchema,
    TodoListQuerySchema,
    UpdateTodoSchema,
} from "../schemas/todos.js";

export const todosRouter = Router();

// Collection: /api/todos
todosRouter
    .route("/")
    .get(validate({ query: TodoListQuerySchema }), todos.listTodos)
    .post(validate({ body: CreateTodoSchema }), todos.createTodo);

// Single item: /api/todos/:id
todosRouter
    .route("/:id")
    .get(validate({ params: TodoIdParamSchema }), todos.getTodoById)
    .put(
        validate({ params: TodoIdParamSchema, body: UpdateTodoSchema }),
        todos.updateTodo
    )
    .delete(validate({ params: TodoIdParamSchema }), todos.deleteTodo);
