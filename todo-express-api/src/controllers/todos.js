/* ---------------------------------------------------------------------------
 * src/controllers/todos.js
 *
 * The "controller" layer for the /api/todos resource. Each exported function
 * is a small async request handler that:
 *
 *   1. Validates the request (id, body, ...).
 *   2. Calls the model (src/models/todos.js) to read or write data.
 *   3. Sends a response using Express's res.json() / res.status() helpers.
 *
 * Because `express.json()` middleware runs before us, `req.body` is already
 * a parsed JavaScript object. We do NOT read the request stream ourselves.
 *
 * Contrast with ../todo-connect-api/src/controllers/todos.js: same logic,
 * but here we call `res.status(400).json({...})` instead of the custom
 * `sendError(res, 400, "...")` helper — Express bakes those helpers in.
 *
 * Any thrown error automatically flows to the error middleware because
 * these handlers are async and Express 4.x+ funnels rejected promises to
 * `next(err)` when we return them. We use the returned-promise style below
 * so we never have to write a try/catch here.
 * -------------------------------------------------------------------------*/

const { readTodos, writeTodos } = require("../models/todos");
const { parseTodoId } = require("../utils/validation");

// GET /api/todos
// GET /api/todos?completed=true
// GET /api/todos?completed=false
//
// "completed" is a QUERY PARAMETER (after the "?"). Express parses the query
// string into req.query for us — the equivalent of url.searchParams in the
// connect version.
async function listTodos(req, res) {
    const todos = await readTodos();
    const completed = req.query.completed;

    if (completed === "true") {
        return res.json(todos.filter((t) => t.completed === true));
    }
    if (completed === "false") {
        return res.json(todos.filter((t) => t.completed === false));
    }
    res.json(todos);
}

// GET /api/todos/:id
//   200 OK        found
//   400 Bad Req.  id is not a positive integer
//   404 Not Found no todo with that id
async function getTodoById(req, res) {
    const id = parseTodoId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Todo ID" });

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    res.json(todo);
}

// POST /api/todos
// Body: { "title": "Learn Express" }
//
// Only `title` is accepted from the client. The server generates `id`,
// `completed` (defaults to false), and `createdAt` — never trust the
// client to invent primary keys or timestamps.
async function createTodo(req, res) {
    const body = req.body || {};

    if (typeof body.title !== "string" || body.title.trim() === "") {
        return res
            .status(400)
            .json({ error: "Field 'title' is required and must be a non-empty string" });
    }

    const todos = await readTodos();
    const nextId = todos.length === 0 ? 1 : Math.max(...todos.map((t) => t.id)) + 1;

    const todo = {
        id: nextId,
        title: body.title.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
    };

    todos.push(todo);
    await writeTodos(todos);

    // 201 Created is the correct status for "a new resource was made".
    res.status(201).json(todo);
}

// PUT /api/todos/:id
// Body: { "title": "...", "completed": true }
//
// Both fields are optional; missing fields are left unchanged. Unknown fields
// (like a fake `id` or `createdAt`) are silently ignored.
async function updateTodo(req, res) {
    const id = parseTodoId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Todo ID" });

    const body = req.body || {};

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Todo not found" });

    if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim() === "") {
            return res
                .status(400)
                .json({ error: "Field 'title' must be a non-empty string" });
        }
        todos[index].title = body.title.trim();
    }
    if (body.completed !== undefined) {
        if (typeof body.completed !== "boolean") {
            return res
                .status(400)
                .json({ error: "Field 'completed' must be a boolean" });
        }
        todos[index].completed = body.completed;
    }

    await writeTodos(todos);
    res.json(todos[index]);
}

// DELETE /api/todos/:id
//   204 No Content   deleted (no response body — conventional for DELETE)
//   400 Bad Req.     invalid id
//   404 Not Found    no todo with that id
async function deleteTodo(req, res) {
    const id = parseTodoId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Todo ID" });

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Todo not found" });

    todos.splice(index, 1);
    await writeTodos(todos);

    // 204 explicitly means "success, and there is NO response body".
    res.status(204).end();
}

module.exports = { listTodos, getTodoById, createTodo, updateTodo, deleteTodo };
