/* ---------------------------------------------------------------------------
 * src/middleware/auth.ts
 *
 * Two related middlewares:
 *
 *   1. `injectCurrentUser`
 *      Runs on every request. If `req.session.userId` is set, load the User
 *      doc and pin it to `req.currentUser` and `res.locals.currentUser`.
 *      Templates read `currentUser` to decide what to show in the header
 *      (login/logout links, own-project actions).
 *
 *      If the session references a user that no longer exists (deleted while
 *      logged in), the session is destroyed and the request continues as if
 *      anonymous.
 *
 *   2. `requireAuth`
 *      Blocks unauthenticated access. If `req.currentUser` is missing after
 *      `injectCurrentUser` ran, remember where they were headed (in
 *      `session.returnTo`, best-effort) and redirect them to /login.
 *
 * Both leave GET /todos, GET /, and the auth pages themselves open — the
 * router only mounts `requireAuth` on the routers that need it.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler, Request } from "express";
import { UserModel, type UserDoc } from "../models/user.js";

// Augment Express.Request so `req.currentUser` is a first-class typed field
// wherever this middleware ran.
declare module "express-serve-static-core" {
    interface Request {
        currentUser?: UserDoc | null;
    }
}

export const injectCurrentUser: RequestHandler = async (req, res, next) => {
    const userId = req.session.userId;
    if (!userId) {
        req.currentUser = null;
        res.locals["currentUser"] = null;
        next();
        return;
    }

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            // Session references a ghost. Wipe it so we don't loop on this
            // request forever.
            req.session.destroy(() => next());
            return;
        }
        req.currentUser = user as UserDoc;
        // Templates receive the JSON-serialisable view of the user (no hash).
        res.locals["currentUser"] = user.toJSON();
        next();
    } catch (err) {
        next(err);
    }
};

export const requireAuth: RequestHandler = (req, res, next) => {
    if (req.currentUser) {
        next();
        return;
    }

    // Best-effort return-to: save the current URL so we can bounce them back
    // after a successful login. Only remember GETs — POSTs would replay a
    // half-completed form.
    if (req.method === "GET") {
        req.session.returnTo = req.originalUrl;
    }
    res.redirect("/login");
};

// One-time module augmentation for the extra session field used above.
declare module "express-session" {
    interface SessionData {
        returnTo?: string;
    }
}

// Small helper for controllers that assume `req.currentUser` is set (i.e.
// they run after `requireAuth`). Narrows the type from `UserDoc | null | undefined`.
export function assertUser(req: Request): UserDoc {
    if (!req.currentUser) {
        // Should never fire in practice because `requireAuth` runs first.
        // If it does, it's a wiring bug — surface it loudly.
        throw new Error("assertUser: expected req.currentUser to be set");
    }
    return req.currentUser;
}
