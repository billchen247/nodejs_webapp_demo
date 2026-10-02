/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 1 — Node.js basics.
 *   We build a tiny HTTP server using Node's built-in `http` module.
 *   No Express, no database, no framework — just Node.js and JavaScript.
 *
 * Learning goals for students:
 *   1. See how Node.js can serve HTTP without any third-party library.
 *   2. Learn how an HTTP request/response cycle looks at the lowest level.
 *   3. Understand that routing is just `if (method === … && url === …)`.
 *   4. See how exports + a `main-module` guard let us keep the file both
 *      runnable (`node src/server.js`) *and* importable from unit tests.
 */

import http from "node:http";
import { tasks } from "./data/tasks.js";

// PORT comes from the environment (so cloud hosts can override it);
// otherwise we fall back to 5000 for local development.
const PORT = process.env.PORT || 5000;

/**
 * Small helper that writes a JSON response with the given status + body.
 * Teaching note: in Node's raw `http` module there is no `res.json()` —
 * we have to set the Content-Type header and `JSON.stringify` by hand.
 */
export function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * The request handler is a plain function that receives (req, res).
 * Node calls it once per incoming HTTP request. We dispatch on
 * method + url manually since we have no routing library yet.
 *
 * Exporting it lets our unit tests pass in a mocked `req`/`res` and
 * assert on the response — no network needed.
 */
export function requestHandler(req, res) {
  const { method, url } = req;

  // GET / — a friendly welcome message describing what the API offers.
  if (method === "GET" && url === "/") {
    return sendJson(res, 200, {
      message: "Welcome to the Week 1 Task Manager (Node.js only)",
      endpoints: ["GET /", "GET /api/tasks", "GET /api/tasks/:id"],
    });
  }

  // GET /api/tasks — list all tasks (the whole in-memory array).
  if (method === "GET" && url === "/api/tasks") {
    return sendJson(res, 200, tasks);
  }

  // GET /api/tasks/:id — fetch a single task by numeric id.
  // Because we have no router, we hand-parse the URL with a regex.
  const match = url && url.match(/^\/api\/tasks\/(\d+)$/);
  if (method === "GET" && match) {
    const id = Number(match[1]);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      return sendJson(res, 404, { error: "Task not found" });
    }
    return sendJson(res, 200, task);
  }

  // Anything that didn't match above is a 404 (Not Found).
  return sendJson(res, 404, { error: "Not Found", method, url });
}

// We export the server object so tests can `.listen(0)` on an ephemeral port.
export const server = http.createServer(requestHandler);

/**
 * Main-module guard. Only start listening if this file is being executed
 * directly (e.g. `node src/server.js`), NOT when it is imported by a test.
 * The URL comparison is the ES-module equivalent of CommonJS's
 * `require.main === module` check.
 */
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  server.listen(PORT, () => {
    console.log(`Week 1 server listening on http://localhost:${PORT}`);
  });
}
