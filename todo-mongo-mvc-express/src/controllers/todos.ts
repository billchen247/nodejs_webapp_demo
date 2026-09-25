/* ---------------------------------------------------------------------------
 * src/controllers/todos.ts
 *
 * The CONTROLLER in MVC — one handler per action. Each handler:
 *
 *   1. Reads request state (params, query, body).
 *   2. Talks to the model (`TodoModel`) — never the DB directly.
 *   3. Renders a view (`res.render("todos/index", { ... })`) OR redirects.
 *
 * Compared to the JSON-API sibling (`todo-mongo-api-express/src/controllers`)
 * the shape is nearly identical except the terminal `res.json(...)` becomes
 * `res.render(view, locals)` or `res.redirect(url)`.
 *
 * Because Express 5 forwards async errors automatically, we let anything the
 * model throws (CastError on a bad ObjectId, ValidationError on a bad title)
 * propagate to the error middleware, which renders a friendly error page.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { TodoModel } from "../models/todo.js";
import { createTodoSchema, updateTodoSchema } from "../schemas/todo.js";
import { HttpError } from "../utils/http-error.js";

/* --- GET /todos -------------------------------------------------------- */
export const listTodos: RequestHandler = async (req, res) => {
    // Optional filter via `?filter=active|completed|all` (defaults to all).
    const filter = String(req.query["filter"] ?? "all");
    const query: Record<string, unknown> = {};
    if (filter === "active") query["completed"] = false;
    if (filter === "completed") query["completed"] = true;

    const todos = await TodoModel.find(query).sort({ createdAt: -1 }).lean({ virtuals: false });

    // `lean()` returns plain objects but keeps `_id`; map to the view shape.
    const items = todos.map((t) => ({
        id: String(t._id),
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    }));

    const counts = {
        total: await TodoModel.estimatedDocumentCount(),
        active: await TodoModel.countDocuments({ completed: false }),
        completed: await TodoModel.countDocuments({ completed: true }),
    };

    res.render("todos/index", {
        title: "Todos",
        todos: items,
        filter,
        counts,
    });
};

/* --- GET /todos/new ---------------------------------------------------- */
export const newTodoForm: RequestHandler = (_req, res) => {
    res.render("todos/new", {
        title: "New todo",
        values: { title: "" },
        errors: {},
    });
};

/* --- POST /todos ------------------------------------------------------- */
export const createTodo: RequestHandler = async (req, res) => {
    const parsed = createTodoSchema.safeParse(req.body);
    if (!parsed.success) {
        const errors = flattenZod(parsed.error);
        res.status(400).render("todos/new", {
            title: "New todo",
            values: req.body ?? {},
            errors,
        });
        return;
    }

    await TodoModel.create({
        title: parsed.data.title,
        completed: parsed.data.completed ?? false,
    });

    res.redirect("/todos");
};

/* --- GET /todos/:id ---------------------------------------------------- */
export const showTodo: RequestHandler = async (req, res) => {
    const id = String(req.params["id"]);
    ensureValidId(id);

    const todo = await TodoModel.findById(id);
    if (!todo) throw new HttpError(404, "Todo not found");

    res.render("todos/show", {
        title: todo.title,
        todo: todo.toObject(),
    });
};

/* --- GET /todos/:id/edit ---------------------------------------------- */
export const editTodoForm: RequestHandler = async (req, res) => {
    const id = String(req.params["id"]);
    ensureValidId(id);

    const todo = await TodoModel.findById(id);
    if (!todo) throw new HttpError(404, "Todo not found");

    res.render("todos/edit", {
        title: `Edit: ${todo.title}`,
        todo: todo.toObject(),
        values: { title: todo.title, completed: todo.completed },
        errors: {},
    });
};

/* --- PUT /todos/:id ---------------------------------------------------- */
export const updateTodo: RequestHandler = async (req, res) => {
    const id = String(req.params["id"]);
    ensureValidId(id);

    const parsed = updateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
        const todo = await TodoModel.findById(id);
        if (!todo) throw new HttpError(404, "Todo not found");
        res.status(400).render("todos/edit", {
            title: `Edit: ${todo.title}`,
            todo: todo.toObject(),
            values: req.body ?? {},
            errors: flattenZod(parsed.error),
        });
        return;
    }

    // Build a minimal update — only include fields the caller actually sent.
    const update: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) update["title"] = parsed.data.title;
    // For checkbox-driven forms, `completed` is either true or absent-meaning-
    // false. Callers who only want to change the title use the JSON API sibling.
    update["completed"] = parsed.data.completed ?? false;

    const updated = await TodoModel.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    });
    if (!updated) throw new HttpError(404, "Todo not found");

    res.redirect("/todos");
};

/* --- POST /todos/:id/toggle -------------------------------------------- */
// UX nicety: a single-button form on the list page to flip `completed`
// without opening the full edit form.
export const toggleTodo: RequestHandler = async (req, res) => {
    const id = String(req.params["id"]);
    ensureValidId(id);

    const todo = await TodoModel.findById(id);
    if (!todo) throw new HttpError(404, "Todo not found");

    todo.completed = !todo.completed;
    await todo.save();

    res.redirect("/todos");
};

/* --- DELETE /todos/:id ------------------------------------------------- */
export const deleteTodo: RequestHandler = async (req, res) => {
    const id = String(req.params["id"]);
    ensureValidId(id);

    const removed = await TodoModel.findByIdAndDelete(id);
    if (!removed) throw new HttpError(404, "Todo not found");

    res.redirect("/todos");
};

/* --- helpers ----------------------------------------------------------- */

function ensureValidId(id: string): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new HttpError(400, "Invalid Todo ID");
    }
}

function flattenZod(err: import("zod").ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        // Keep the first message per field only — that's what the form displays.
        if (!(key in out)) out[key] = issue.message;
    }
    return out;
}
