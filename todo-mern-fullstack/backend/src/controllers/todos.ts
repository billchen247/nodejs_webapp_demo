/* =============================================================================
 * src/controllers/todos.ts — request handlers for /api/todos
 * =============================================================================
 *
 * Pattern: **thin controllers**. Each handler does exactly:
 *
 *   1. Pull inputs off the request (`req.params`, `req.body`).
 *   2. Validate them with Zod (fail → 400 Bad Request).
 *   3. Call the Mongoose model.
 *   4. Return JSON.
 *
 * Any error is forwarded to Express via `next(err)` so the error-handler
 * middleware in `middleware/errorHandler.ts` can convert it to a response.
 * This keeps every handler free of try/catch clutter.
 *
 * In Express 5 you can also just throw / reject from an async handler and
 * Express will catch it — no `express-async-handler` wrapper needed.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TodoModel } from "../models/Todo.js";

/* ---------------------------------------------------------------------------
 * Zod schemas — one per shape of input. Zod gives us:
 *   • runtime validation
 *   • a precisely-typed object on success
 *   • a nice `.issues` array on failure
 * ------------------------------------------------------------------------- */
const createTodoSchema = z.object({
    title: z.string().trim().min(1, "Title is required.").max(200),
    completed: z.boolean().optional(),
});

const updateTodoSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    completed: z.boolean().optional(),
}).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: "Provide at least one field to update." },
);

const idParamSchema = z.object({
    // Mongo ObjectId strings are 24 hex characters.
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id."),
});

/* ---------------------------------------------------------------------------
 * GET /api/todos — list all todos, newest first.
 * ------------------------------------------------------------------------- */
export async function listTodos(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const todos = await TodoModel.find().sort({ createdAt: -1 }).exec();
        res.json(todos);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------------------------
 * GET /api/todos/:id — fetch one todo.
 * ------------------------------------------------------------------------- */
export async function getTodo(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const todo = await TodoModel.findById(id).exec();
        if (!todo) {
            res.status(404).json({ error: "Todo not found." });
            return;
        }
        res.json(todo);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------------------------
 * POST /api/todos — create a new todo.
 * ------------------------------------------------------------------------- */
export async function createTodo(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = createTodoSchema.parse(req.body);
        const created = await TodoModel.create(input);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------------------------
 * PATCH /api/todos/:id — partial update.
 * We use PATCH (partial) rather than PUT (full replace) because clients
 * typically want to toggle just one field.
 * ------------------------------------------------------------------------- */
export async function updateTodo(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const patch = updateTodoSchema.parse(req.body);

        // `new: true` returns the updated document (not the pre-update one).
        // `runValidators: true` re-runs schema validators on the patch.
        const updated = await TodoModel.findByIdAndUpdate(id, patch, {
            new: true,
            runValidators: true,
        }).exec();

        if (!updated) {
            res.status(404).json({ error: "Todo not found." });
            return;
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------------------------
 * DELETE /api/todos/:id — remove a todo.
 * ------------------------------------------------------------------------- */
export async function deleteTodo(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const result = await TodoModel.findByIdAndDelete(id).exec();
        if (!result) {
            res.status(404).json({ error: "Todo not found." });
            return;
        }
        // 204 = success, no body. Common convention for DELETE.
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
