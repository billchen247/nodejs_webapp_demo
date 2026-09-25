/* ---------------------------------------------------------------------------
 * src/middleware/errors.ts
 *
 * Two terminal middlewares for the MVC app:
 *
 *   * notFoundHandler — nothing above us matched the URL, so render a 404 page.
 *   * errorHandler    — any thrown error, or `next(err)` upstream, lands here.
 *                       Express identifies error handlers by their FOUR-
 *                       argument signature `(err, req, res, next)`. The
 *                       unused `next` MUST stay in the signature — Express
 *                       inspects `fn.length` to route errors.
 *
 * Unlike the JSON-API sibling, we render HTML error pages here. Mongoose-
 * specific errors are still translated into the appropriate status code.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/http-error.js";

export const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).render("404", {
        title: "Not found",
        path: req.originalUrl,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (res.headersSent) {
        res.end();
        return;
    }

    const { status, message } = classify(err);

    if (status >= 500) {
        console.error("Unhandled error while processing request:", err);
    }

    res.status(status).render("error", {
        title: `Error ${status}`,
        status,
        message,
    });
};

function classify(err: unknown): { status: number; message: string } {
    if (err instanceof HttpError) {
        return { status: err.status, message: err.message };
    }
    if (err instanceof mongoose.Error.CastError) {
        // `CastError` doesn't type its `model` field publicly, but Mongoose
        // does attach it at runtime for schema-driven casts. Reach in via a
        // narrow shape so we can render "Invalid Project ID" instead of the
        // generic message.
        const modelName = (err as unknown as { model?: { modelName?: string } }).model?.modelName;
        const label = modelName ?? "resource";
        return { status: 400, message: `Invalid ${label} ID` };
    }
    if (err instanceof mongoose.Error.ValidationError) {
        const firstField = Object.values(err.errors)[0];
        return { status: 400, message: firstField?.message ?? "Invalid request" };
    }
    if (
        err !== null &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
    ) {
        return { status: 409, message: "Duplicate resource" };
    }
    return { status: 500, message: "Internal Server Error" };
}
