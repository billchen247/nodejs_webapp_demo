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
 * What's new here vs the JSON-file sibling
 * ----------------------------------------
 * We now also translate Mongoose-specific errors into clean HTTP responses:
 *   * `CastError` on `_id`     → 400 Invalid Todo ID
 *   * `ValidationError`        → 400 with the first offending field's message
 *   * MongoServerError 11000   → 409 Conflict (duplicate key)
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
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

    // Zod validation error → 400 with the first issue's message.
    if (err instanceof ZodError) {
        const first = err.issues[0];
        res.status(400).json({ error: first?.message ?? "Invalid request" });
        return;
    }

    // Our own domain errors.
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    // Mongoose: bad ObjectId in a query or update
    // (e.g. `TodoModel.findById("not-a-valid-id")`).
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: "Invalid Todo ID" });
        return;
    }

    // Mongoose: schema-level validation failure (required / min / type).
    if (err instanceof mongoose.Error.ValidationError) {
        const firstField = Object.values(err.errors)[0];
        res.status(400).json({
            error: firstField?.message ?? "Invalid request",
        });
        return;
    }

    // MongoDB driver: duplicate key on a unique index (E11000).
    if (
        err !== null &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
    ) {
        res.status(409).json({ error: "Duplicate resource" });
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
