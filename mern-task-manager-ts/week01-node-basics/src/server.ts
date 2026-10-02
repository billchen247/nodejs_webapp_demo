/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 01
 * File: src/server.ts
 *
 * Week 1 goal: understand what Node.js actually is.
 *
 * We use ONLY Node's built-in `http` module — no Express, no framework.
 * Doing it the hard way once makes it obvious what Express is doing for us
 * later. Everything below is just reading a request and writing a response.
 *
 * Supported endpoints:
 *   GET /                  → a friendly welcome message
 *   GET /api/tasks         → the full list of tasks
 *   GET /api/tasks/:id     → one task by id
 *
 * Anything else returns 404 so students see what the "not found" case looks like.
 */
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { getAllTasks, getTaskById } from "./data/tasks.js";

/**
 * Centralised JSON responder.
 *
 * Why a helper?
 *   - Students see once (here) what sending JSON actually involves:
 *     set the status code, set the Content-Type header, serialise with
 *     JSON.stringify, and end the response. Every endpoint can then stay
 *     focused on the business logic.
 */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/**
 * The request handler is a plain function.
 *
 * Exporting it (rather than only exporting the created server) lets our tests
 * create their own server instance pointed at a random port, which keeps the
 * test suite independent of the real app's PORT configuration.
 */
export function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  // Node's `req.url` includes the query string, so we parse it into a URL
  // object. Using the WHATWG URL class is the modern approach — the old
  // `url.parse` API is deprecated.
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const { pathname } = url;
  const method = req.method ?? "GET";

  // We only answer GETs this week. Reject anything else early with 405
  // so the "what methods are allowed" conversation happens at the right time.
  if (method !== "GET") {
    sendJson(res, 405, { error: "Method Not Allowed", method });
    return;
  }

  // Root / welcome route.
  if (pathname === "/") {
    sendJson(res, 200, {
      message: "Welcome to the Week 1 Task Manager API",
      hint: "Try GET /api/tasks or GET /api/tasks/1",
    });
    return;
  }

  // List all tasks.
  if (pathname === "/api/tasks") {
    sendJson(res, 200, getAllTasks());
    return;
  }

  // Fetch a single task by id. The id is the last path segment.
  //
  // We use a small regex rather than Express-style route parameters because
  // the raw http module does not do route matching for us — this is one of
  // the pain points we will relieve in Week 2.
  const match = pathname.match(/^\/api\/tasks\/(.+)$/);
  if (match) {
    const idPart = match[1];
    const id = Number(idPart);

    // Reject non-numeric ids explicitly rather than silently treating NaN as 0.
    if (!Number.isInteger(id)) {
      sendJson(res, 400, { error: "Invalid task id", id: idPart });
      return;
    }

    const task = getTaskById(id);
    if (!task) {
      // 404 means "the server understood the request but has no such thing".
      sendJson(res, 404, { error: "Task not found", id });
      return;
    }

    sendJson(res, 200, task);
    return;
  }

  // Fallback: unknown route.
  sendJson(res, 404, { error: "Not Found", path: pathname });
}

/** Build an http.Server using our handler. Exported so tests can start it on an ephemeral port. */
export function createServer(): http.Server {
  return http.createServer(handleRequest);
}

/**
 * Only start listening when this file is executed directly (not when it is
 * imported from a test). `import.meta.url` is the modern replacement for the
 * CommonJS `require.main === module` idiom.
 */
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer();
  server.listen(port, () => {
    // eslint-disable-next-line no-console -- intentional startup log
    console.log(`Week 1 server listening on http://localhost:${port}`);
  });
}
