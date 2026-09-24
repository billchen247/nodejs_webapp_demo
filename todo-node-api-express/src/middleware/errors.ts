/* ---------------------------------------------------------------------------
 * src/middleware/errors.ts
 *
 * Two terminal middlewares that live at the end of the Express chain:
 *
 *   * notFoundHandler — nothing above us matched the URL, so it must be one
 *                       we don't serve. Reply with a JSON 404.
 *   * errorHandler    — any thrown error, or `next(err)` upstream, lands here.
 *                       Express identifies error handlers by their FOUR-
 *                       argument signature `(err, req, res, next)`. The
 *                       unused `next` MUST stay in the signature — Express
 *                       inspects `fn.length` to route errors.
 *
 * Compared to the sister projects
 * -------------------------------
 * The Connect version does the same thing with hand-written middleware; the
 * raw-http version does it inside one big try/catch. Express 5 improved this
 * area over Express 4: async route handlers that throw or reject a promise
 * now forward the error to this handler automatically — you no longer need
 * `express-async-errors` or a `try { ... } catch (e) { next(e); }` wrapper.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ error: "Route not found" });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    // If the response already started streaming there is nothing we can do
    // except close the connection.
    if (res.headersSent) {
        res.end();
        return;
    }

    // Zod validation error → 400 with the first issue's message. This keeps
    // controllers simple: they can call `.parse()` and let the thrown ZodError
    // become a clean 400 up here.
    if (err instanceof ZodError) {
        const first = err.issues[0];
        res.status(400).json({ error: first?.message ?? "Invalid request" });
        return;
    }

    // Domain errors we threw ourselves.
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    // Bad JSON body: Express's built-in express.json() throws a SyntaxError
    // with `.type === "entity.parse.failed"` when parsing fails.
    if (
        err instanceof SyntaxError &&
        "status" in err &&
        (err as SyntaxError & { status?: number }).status === 400
    ) {
        res.status(400).json({ error: "Invalid JSON body" });
        return;
    }

    // Unknown / unexpected. Log server-side, return a generic 500.
    console.error("Unhandled error while processing request:", err);
    res.status(500).json({ error: "Internal Server Error" });
};
