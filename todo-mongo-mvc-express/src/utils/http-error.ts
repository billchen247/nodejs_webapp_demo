/* ---------------------------------------------------------------------------
 * src/utils/http-error.ts
 *
 * A tiny Error subclass that carries an HTTP status. Controllers throw it;
 * the error middleware in `src/middleware/errors.ts` reads `.status` to pick
 * the response code.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

export class HttpError extends Error {
    public readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}
