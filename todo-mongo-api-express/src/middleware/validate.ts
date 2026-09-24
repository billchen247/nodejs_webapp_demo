/* ---------------------------------------------------------------------------
 * src/middleware/validate.ts
 *
 * A small factory that turns a Zod schema into an Express middleware. Given a
 * schema for `body`, `params`, or `query`, it parses the request in place — so
 * downstream handlers see already-typed, already-validated data.
 *
 * Why a middleware and not `.parse()` inside each controller?
 *   - Consistency: one place decides what "invalid input" looks like.
 *   - Composability: `validate({ body: X, params: Y })` chains onto any route
 *     with `router.post("/", validate({ body: X }), handler)`.
 *   - Auto-400: parse errors throw ZodError, which the errorHandler in
 *     middleware/errors.ts already turns into a clean 400 response.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

interface ValidateSchemas {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

export function validate(schemas: ValidateSchemas): RequestHandler {
    return (req, _res, next) => {
        if (schemas.body) {
            req.body = schemas.body.parse(req.body);
        }
        if (schemas.params) {
            req.params = schemas.params.parse(req.params);
        }
        if (schemas.query) {
            // In Express 5, `req.query` is a lazy getter that re-parses the URL
            // on every access, so mutations to the returned object are thrown
            // away next time it's read. To make the parsed (and coerced)
            // values stick, we redefine the property as a plain value.
            const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
            Object.defineProperty(req, "query", {
                value: parsed,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
        next();
    };
}
