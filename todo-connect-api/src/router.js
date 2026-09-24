/* ---------------------------------------------------------------------------
 * src/router.js
 *
 * Manual routing exposed as a single Connect middleware.
 *
 * Connect deliberately does NOT ship a router. Express adds one on top; here
 * we write our own so students see exactly what a router is:
 *
 *     "a middleware that inspects (method, pathname) and calls the right
 *      controller — or calls next() so downstream middleware can try."
 *
 * Matching strategy is the same as the sister ../todo-node-api project:
 *
 *   pathname          segments             match?
 *   ----------------  -------------------  ---------------------
 *   /                 []                   home page
 *   /api/todos        ["api","todos"]      todos collection
 *   /api/todos/1      ["api","todos","1"]  single todo (id = 1)
 *   /api/pets         ["api","pets"]       no match -> next() -> 404 mw
 *
 * When the URL matches a known resource but the HTTP verb doesn't, we return
 * 405 Method Not Allowed with an `Allow` header — this is what the HTTP spec
 * requires.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const homeController = require("./controllers/home");
const todosController = require("./controllers/todos");
const { sendError } = require("./utils/response");

async function router(req, res, next) {
    try {
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
            if (method === "GET") return await homeController.showHomePage(res);
            res.setHeader("Allow", "GET");
            return sendError(res, 405, "Method Not Allowed");
        }

        // ------- collection: /api/todos --------------------------------------
        if (segments.length === 2 && segments[0] === "api" && segments[1] === "todos") {
            if (method === "GET") return await todosController.listTodos(res, url);
            if (method === "POST") return await todosController.createTodo(req, res);
            res.setHeader("Allow", "GET, POST");
            return sendError(res, 405, "Method Not Allowed");
        }

        // ------- single item: /api/todos/:id ---------------------------------
        if (segments.length === 3 && segments[0] === "api" && segments[1] === "todos") {
            const idString = segments[2];
            if (method === "GET") return await todosController.getTodoById(res, idString);
            if (method === "PUT") return await todosController.updateTodo(req, res, idString);
            if (method === "DELETE") return await todosController.deleteTodo(res, idString);
            res.setHeader("Allow", "GET, PUT, DELETE");
            return sendError(res, 405, "Method Not Allowed");
        }

        // Nothing matched — hand off to the next middleware. The `notFound`
        // middleware registered in src/app.js will turn this into a 404.
        return next();
    } catch (err) {
        // Any thrown error becomes a `next(err)` call, which skips ahead to
        // the error-handling middleware.
        next(err);
    }
}

module.exports = { router };
