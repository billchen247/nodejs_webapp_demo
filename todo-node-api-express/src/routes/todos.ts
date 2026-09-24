/* ---------------------------------------------------------------------------
 * src/routes/todos.ts
 *
 * The Express router for the /api/todos resource. This is where the framework
 * finally earns its keep compared to the sister projects: instead of writing
 * a hand-rolled `if (segments[0] === "api" && ...)` matcher, we declare each
 * verb + path pair and Express does the rest — parameter extraction, HTTP
 * 405 handling, method binding.
 *
 * The `validate(...)` middleware runs BEFORE each handler and turns bad
 * input into a 400 via the central errorHandler. Because Zod schemas are
 * declarative, the routes end up as a thin table of intent:
 *
 *     GET    /            -> listTodos
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
