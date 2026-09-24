/* ---------------------------------------------------------------------------
 * src/router.js
 *
 * Manual routing. Express lets you write:
 *
 *     app.get("/api/todos/:id", handler);
 *
 * and it parses the URL, extracts :id, and calls your handler. Here we do
 * the same job by hand so students can see what that shortcut is doing.
 *
 * Matching strategy:
 *
 *   pathname          segments             match?
 *   ----------------  -------------------  ---------------------
 *   /                 []                   home page
 *   /api/todos        ["api","todos"]      todos collection
 *   /api/todos/1      ["api","todos","1"]  single todo (id = 1)
 *   /api/pets         ["api","pets"]       no match -> 404
 *
 * When the URL matches a known resource but the HTTP verb doesn't, we return
 * 405 Method Not Allowed with an `Allow` header listing the accepted verbs —
 * this is what the HTTP spec requires.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const homeController = require("./controllers/home");
const todosController = require("./controllers/todos");
const { sendError } = require("./utils/response");

async function route(req, res) {
    // Node gives us req.url as a path + query (e.g. "/api/todos?foo=bar").
    // The WHATWG URL constructor needs an absolute URL, so we prepend a
    // dummy base derived from the Host header. The base is only used for
    // parsing; we throw it away.
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;
    const method = req.method;

    // "/api/todos/1" -> ["api", "todos", "1"]. filter(Boolean) drops the
    // empty strings that appear at the start (leading "/") and after a
    // trailing "/".
    const segments = pathname.split("/").filter(Boolean);

    // ------- home page: GET / --------------------------------------------
    if (segments.length === 0) {
        if (method === "GET") return homeController.showHomePage(res);
        res.setHeader("Allow", "GET");
        return sendError(res, 405, "Method Not Allowed");
    }

    // ------- collection: /api/todos --------------------------------------
    if (segments.length === 2 && segments[0] === "api" && segments[1] === "todos") {
        if (method === "GET") return todosController.listTodos(res, url);
        if (method === "POST") return todosController.createTodo(req, res);
        res.setHeader("Allow", "GET, POST");
        return sendError(res, 405, "Method Not Allowed");
    }

    // ------- single item: /api/todos/:id ---------------------------------
    if (segments.length === 3 && segments[0] === "api" && segments[1] === "todos") {
        const idString = segments[2];
        if (method === "GET") return todosController.getTodoById(res, idString);
        if (method === "PUT") return todosController.updateTodo(req, res, idString);
        if (method === "DELETE") return todosController.deleteTodo(res, idString);
        res.setHeader("Allow", "GET, PUT, DELETE");
        return sendError(res, 405, "Method Not Allowed");
    }

    // No pattern matched — the client asked for a URL we don't serve.
    return sendError(res, 404, "Route not found");
}

module.exports = { route };
