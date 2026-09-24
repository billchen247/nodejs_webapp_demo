/* ---------------------------------------------------------------------------
 * src/controllers/todos.js
 *
 * The "controller" layer for the /api/todos resource. Each exported function
 * is a small async request handler that:
 *
 *   1. Validates the request (id, body, ...).
 *   2. Calls the model (src/models/todos.js) to read or write data.
 *   3. Sends a response using src/utils/response.js.
 *
 * Because the body-parser middleware (src/middleware/body.js) has already
 * run by the time we get here, `req.body` is a parsed JavaScript object.
 * We do NOT read the request stream ourselves. This is the whole point of a
 * middleware pipeline: each stage does one job and hands a richer `req` to
 * the next stage.
 *
 * Contrast with ../todo-node-api/src/controllers/todos.js: there, the
 * controllers themselves `await readRequestBody(req)`. Here, the framework
 * did it for us.
 * -------------------------------------------------------------------------*/

const { readTodos, writeTodos } = require("../models/todos");
const { sendJson, sendError } = require("../utils/response");
const { parseTodoId } = require("../utils/validation");

// GET /api/todos
// GET /api/todos?completed=true
// GET /api/todos?completed=false
//
// "completed" is a QUERY PARAMETER (after the "?"). Query parameters live in
// url.searchParams and are for optional filtering. Contrast this with :id
// in /api/todos/:id, which is a PATH parameter identifying which resource.
async function listTodos(res, url) {
    const todos = await readTodos();
    const completed = url.searchParams.get("completed");

    if (completed === "true") {
        return sendJson(res, 200, todos.filter((t) => t.completed === true));
    }
    if (completed === "false") {
        return sendJson(res, 200, todos.filter((t) => t.completed === false));
    }
    return sendJson(res, 200, todos);
}

// GET /api/todos/:id
//   200 OK        found
//   400 Bad Req.  id is not a positive integer
//   404 Not Found no todo with that id
async function getTodoById(res, idString) {
    const id = parseTodoId(idString);
    if (id === null) return sendError(res, 400, "Invalid Todo ID");

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return sendError(res, 404, "Todo not found");

    sendJson(res, 200, todo);
}

// POST /api/todos
// Body: { "title": "Learn Node.js" }
//
// Only `title` is accepted from the client. The server generates `id`,
// `completed` (defaults to false), and `createdAt` — never trust the client
// to invent primary keys or timestamps.
async function createTodo(req, res) {
    const body = req.body || {};

    if (typeof body.title !== "string" || body.title.trim() === "") {
        return sendError(res, 400, "Field 'title' is required and must be a non-empty string");
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
    sendJson(res, 201, todo);
}

// PUT /api/todos/:id
// Body: { "title": "...", "completed": true }
//
// Both fields are optional; missing fields are left unchanged. Unknown fields
// (like a fake `id` or `createdAt`) are silently ignored.
async function updateTodo(req, res, idString) {
    const id = parseTodoId(idString);
    if (id === null) return sendError(res, 400, "Invalid Todo ID");

    const body = req.body || {};

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return sendError(res, 404, "Todo not found");

    if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim() === "") {
            return sendError(res, 400, "Field 'title' must be a non-empty string");
        }
        todos[index].title = body.title.trim();
    }
    if (body.completed !== undefined) {
        if (typeof body.completed !== "boolean") {
            return sendError(res, 400, "Field 'completed' must be a boolean");
        }
        todos[index].completed = body.completed;
    }

    await writeTodos(todos);
    sendJson(res, 200, todos[index]);
}

// DELETE /api/todos/:id
//   204 No Content   deleted (no response body — conventional for DELETE)
//   400 Bad Req.     invalid id
//   404 Not Found    no todo with that id
async function deleteTodo(res, idString) {
    const id = parseTodoId(idString);
    if (id === null) return sendError(res, 400, "Invalid Todo ID");

    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return sendError(res, 404, "Todo not found");

    todos.splice(index, 1);
    await writeTodos(todos);

    // 204 explicitly means "success, and there is NO response body".
    res.writeHead(204);
    res.end();
}

module.exports = { listTodos, getTodoById, createTodo, updateTodo, deleteTodo };
