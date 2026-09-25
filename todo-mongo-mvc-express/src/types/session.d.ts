/* ---------------------------------------------------------------------------
 * src/types/session.d.ts
 *
 * Module augmentation for `express-session` so `req.session.userId` and
 * `req.session.flash` are strongly typed everywhere they're used.
 *
 * TypeScript's rule: any `.d.ts` in the compilation unit that declares a
 * `declare module "…"` block merges into that module's exported interface.
 * `SessionData` is the plain object stored on `req.session`.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import "express-session";

declare module "express-session" {
    interface SessionData {
        /** Mongo ObjectId (as a hex string) of the authenticated user, if any. */
        userId?: string;
        /**
         * Read-once notice shown on the next rendered page (Post/Redirect/Get).
         * The middleware in src/middleware/flash.ts clears this after copying
         * it onto `res.locals` so a refresh never re-shows the same message.
         */
        flash?: { type: "success" | "error" | "info"; message: string };
    }
}
