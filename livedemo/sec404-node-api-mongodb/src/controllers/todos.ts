/* ---------------------------------------------------------------------------
 * src/controllers/todos.ts
 *
 * The "controller" layer for the /api/todos resource. Each exported handler
 * is a small async Express handler that:
 *
 *   1. Reads already-validated data off req.body / req.params / req.query
 *      (the `validate` middleware in src/middleware/validate.ts has run).
 *   2. Calls the Mongoose model to read or write documents.
 *   3. Replies with `res.status(x).json(...)`, or throws an HttpError.
 *
 * Compared to the JSON-file sister project
 * ---------------------------------------
 *   - We no longer read the whole collection into memory to answer a query.
 *     Mongo does the filtering, indexing, and sorting server-side.
 *   - We no longer own the `id` counter — Mongo assigns ObjectIds.
 *   - We rely on the schema's `toJSON` transform (see models/todos.ts) to
 *     hand back `{ id, title, completed, createdAt, updatedAt }` on the wire.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { TodoModel } from "../models/todos.js";
import { ProjectModel } from "../models/projects.js";
import type {
    CreateTodoInput,
    UpdateTodoInput,
    TodoListQuery,
} from "../schemas/todos.js";
import { notFound } from "../utils/http-error.js";

// GET /api/todos
// GET /api/todos?completed=true|false&limit=N&skip=N
export const listTodos: RequestHandler = async (req, res) => {
    const query = req.query as unknown as TodoListQuery;

    const filter: Record<string, unknown> = {};
    if (query.completed === "true") filter["completed"] = true;
    else if (query.completed === "false") filter["completed"] = false;

    let cursor = TodoModel.find(filter).sort({ createdAt: 1, _id: 1 });
    if (typeof query.skip === "number") cursor = cursor.skip(query.skip);
    if (typeof query.limit === "number") cursor = cursor.limit(query.limit);

    const todos = await cursor.exec();
    res.json(todos);
};

// GET /api/todos/:id
export const getTodoById: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };

    const todo = await TodoModel.findById(id).exec();
    if (!todo) throw notFound("Todo not found");

    res.json(todo);
};

// POST /api/todos
// Body: { title: string }
// Server owns id, completed (defaults to false), timestamps.
export const createTodo: RequestHandler = async (req, res) => {
    const body = req.body as CreateTodoInput;

    // If a projectId was supplied, verify the parent exists — otherwise the
    // client would be able to create orphaned todos.
    if (body.projectId !== undefined) {
        const parent = await ProjectModel.findById(body.projectId);
        if (!parent) throw notFound("Project not found");
    }

    // `create` runs schema validation, so an all-whitespace title (already
    // trimmed by Zod) or a missing field still surfaces as a 400 via the
    // ValidationError branch in middleware/errors.ts.
    const todo = await TodoModel.create({
        title: body.title,
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
    });

    // 201 Created is the correct status for "a new resource was made".
    res.status(201).json(todo);
};

// PUT /api/todos/:id
// Body: { title?: string; completed?: boolean }
// Both fields optional; missing fields are left unchanged.
export const updateTodo: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateTodoInput;

    // Two-step so we get a real 404 for a missing document AND schema-level
    // validation (e.g. `title: ""`) runs on the individual fields.
    const todo = await TodoModel.findById(id).exec();
    if (!todo) throw notFound("Todo not found");

    if (body.title !== undefined) todo.title = body.title;
    if (body.completed !== undefined) todo.completed = body.completed;

    await todo.save();
    res.json(todo);
};

// DELETE /api/todos/:id — 204 with no response body (conventional for DELETE).
export const deleteTodo: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await TodoModel.findByIdAndDelete(id).exec();
    if (!result) throw notFound("Todo not found");

    res.status(204).end();
};
