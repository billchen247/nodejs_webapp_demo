/* ---------------------------------------------------------------------------
 * src/controllers/todos.ts
 *
 * The "controller" layer for the /api/todos resource. Each exported handler
 * is a small async Express handler that:
 *
 *   1. Reads already-validated data off req.body / req.params / req.query
 *      (the `validate` middleware in src/middleware/validate.ts has run).
 *   2. Calls the model (src/models/todos.ts) to read or write data.
 *   3. Replies with `res.status(x).json(...)`, or throws an HttpError to let
 *      the central error handler send the response.
 *
 * Compared to the sister projects
 * -------------------------------
 *   - todo-node-api        : controllers awaited readRequestBody(req) and
 *                            did their own validation and 404 wiring.
 *   - todo-connect-api     : middleware pre-parsed req.body but controllers
 *                            still did their own type checks.
 *   - this one (Express 5) : Zod validation is a route-level middleware, so
 *                            controllers get typed inputs and only handle
 *                            the domain logic.
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { readTodos, writeTodos, type Todo } from "../models/todos.js";
import {
    type CreateTodoInput,
    type UpdateTodoInput,
} from "../schemas/todos.js";
import { notFound } from "../utils/http-error.js";

// GET /api/todos
// GET /api/todos?completed=true|false
export const listTodos: RequestHandler = async (req, res) => {
    const todos = await readTodos();
    const completed = (req.query as { completed?: "true" | "false" }).completed;

    if (completed === "true") {
        res.json(todos.filter((t) => t.completed === true));
        return;
    }
    if (completed === "false") {
        res.json(todos.filter((t) => t.completed === false));
        return;
    }
    res.json(todos);
};

// GET /api/todos/:id
export const getTodoById: RequestHandler = async (req, res) => {
    // `validate` has already coerced the string param into a number.
    const id = (req.params as unknown as { id: number }).id;

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === id);
    if (!todo) throw notFound("Todo not found");

    res.json(todo);
};

// POST /api/todos
// Body: { title: string }
// Server owns id, completed (defaults to false), createdAt.
export const createTodo: RequestHandler = async (req, res) => {
    const body = req.body as CreateTodoInput;

    const todos = await readTodos();
    const nextId =
        todos.length === 0 ? 1 : Math.max(...todos.map((t) => t.id)) + 1;

    const todo: Todo = {
        id: nextId,
        title: body.title,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    todos.push(todo);
    await writeTodos(todos);

    // 201 Created is the correct status for "a new resource was made".
    res.status(201).json(todo);
};

// PUT /api/todos/:id
// Body: { title?: string; completed?: boolean }
// Both fields optional; missing fields are left unchanged.
export const updateTodo: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const body = req.body as UpdateTodoInput;

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) throw notFound("Todo not found");

    // `todos[index]` is guaranteed defined by the findIndex check above, but
    // TS with noUncheckedIndexedAccess still needs the assertion.
    const existing = todos[index] as Todo;

    if (body.title !== undefined) existing.title = body.title;
    if (body.completed !== undefined) existing.completed = body.completed;

    await writeTodos(todos);
    res.json(existing);
};

// DELETE /api/todos/:id — 204 with no response body (conventional for DELETE).
export const deleteTodo: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) throw notFound("Todo not found");

    todos.splice(index, 1);
    await writeTodos(todos);
    res.status(204).end();
};
