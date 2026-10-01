/* =============================================================================
 * src/middleware/errorHandler.ts — central error-to-JSON converter
 * =============================================================================
 *
 * Express recognises "error middleware" by its **four-argument signature**
 * `(err, req, res, next)`. Any `next(err)` call or thrown exception in an
 * async handler flows here. Having a single error handler means every route
 * returns errors in the same JSON shape:
 *
 *     { "error": "...", "details": { ... } }
 *
 * We handle the common error types explicitly, and fall back to a generic
 * 500 for anything we didn't anticipate.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    // `next` MUST be in the signature even if we don't use it, otherwise
    // Express won't recognise this as an error-middleware (it checks arity).
    _next: NextFunction,
): void {
    /* ---------- 1. Zod validation errors ------------------------------ */
    if (err instanceof ZodError) {
        res.status(400).json({
            error: "Validation failed.",
            details: err.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
            })),
        });
        return;
    }

    /* ---------- 2. Mongoose validation / cast errors ------------------ */
    if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            error: "Database validation failed.",
            details: Object.fromEntries(
                Object.entries(err.errors).map(([k, v]) => [k, v.message]),
            ),
        });
        return;
    }
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: `Invalid value for ${err.path}.` });
        return;
    }

    /* ---------- 3. Fallback ------------------------------------------- */
    console.error("[errorHandler] unexpected:", err);
    const message =
        err instanceof Error ? err.message : "Internal server error.";
    res.status(500).json({ error: message });
}
