/* ---------------------------------------------------------------------------
 * src/middleware/flash.ts
 *
 * Minimal flash-message support built on top of the session. Controllers stash
 * a one-time message on `req.session.flash` and immediately redirect; this
 * middleware, on the *next* request, copies that message onto `res.locals.flash`
 * so templates can render it, then clears it so a refresh never re-shows it.
 *
 * This avoids a full `connect-flash` dependency for the two-line feature we
 * actually need.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";

export const flash: RequestHandler = (req, res, next) => {
    const msg = req.session.flash;
    res.locals["flash"] = msg ?? null;
    if (msg) delete req.session.flash;
    next();
};
