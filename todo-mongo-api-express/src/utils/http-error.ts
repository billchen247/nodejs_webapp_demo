/* ---------------------------------------------------------------------------
 * src/utils/http-error.ts
 *
 * A tiny Error subclass that carries an HTTP status code. Controllers throw
 * these; the errorHandler middleware turns them into `{ status, body }`.
 *
 * Why not just `res.status(x).json(...)` inline?
 *   - Throwing keeps the happy path uncluttered (no nested `if (bad) return`).
 *   - Express 5's async router forwards thrown errors to the error handler
 *     automatically, so we don't need `try/catch` in every route.
 *   - Centralising the error->response mapping makes it easy to log/format
 *     every failure the same way.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

export class HttpError extends Error {
    public readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

// Common shortcuts — keeps controllers readable.
export const badRequest = (msg: string) => new HttpError(400, msg);
export const notFound = (msg: string) => new HttpError(404, msg);
