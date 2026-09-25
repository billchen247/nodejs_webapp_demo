/* ---------------------------------------------------------------------------
 * src/controllers/auth.ts
 *
 * Signup / login / logout. The three-step choreography per action:
 *
 *   1. Zod-validate the form body. On failure, re-render the form with the
 *      field-level errors and the user's non-secret input preserved.
 *   2. Talk to the User model (create, or findByEmail + verifyPassword).
 *   3. Set (or destroy) `req.session.userId`, then redirect.
 *
 * `req.session.regenerate()` is called on both signup and login to defeat
 * session fixation — the old session ID is discarded and a fresh one is
 * issued alongside the new authenticated identity.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { UserModel } from "../models/user.js";
import { signupSchema, loginSchema } from "../schemas/user.js";
import { flattenZod } from "../utils/flatten-zod.js";
import { SESSION_COOKIE_NAME } from "../config.js";

/* --- GET /signup ------------------------------------------------------- */
export const newSignupForm: RequestHandler = (req, res) => {
    // Already signed in? Skip straight to the app.
    if (req.currentUser) {
        res.redirect("/projects");
        return;
    }
    res.render("auth/signup", {
        title: "Sign up",
        values: { name: "", email: "" },
        errors: {},
    });
};

/* --- POST /signup ------------------------------------------------------ */
export const createSignup: RequestHandler = async (req, res, next) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("auth/signup", {
            title: "Sign up",
            values: { name: req.body?.name ?? "", email: req.body?.email ?? "" },
            errors: flattenZod(parsed.error),
        });
        return;
    }

    // Reject a duplicate email early so the user gets a friendly form-level
    // message instead of relying on the 11000 duplicate-key path.
    const existing = await UserModel.findByEmail(parsed.data.email);
    if (existing) {
        res.status(400).render("auth/signup", {
            title: "Sign up",
            values: { name: parsed.data.name, email: parsed.data.email },
            errors: { email: "An account with this email already exists" },
        });
        return;
    }

    const user = new UserModel({
        name: parsed.data.name,
        email: parsed.data.email,
    });
    await user.setPassword(parsed.data.password);
    await user.save();

    req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = String(user._id);
        req.session.flash = { type: "success", message: `Welcome, ${user.name}!` };
        req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            res.redirect("/projects");
        });
    });
};

/* --- GET /login -------------------------------------------------------- */
export const newLoginForm: RequestHandler = (req, res) => {
    if (req.currentUser) {
        res.redirect("/projects");
        return;
    }
    res.render("auth/login", {
        title: "Log in",
        values: { email: "" },
        errors: {},
    });
};

/* --- POST /login ------------------------------------------------------- */
export const createLogin: RequestHandler = async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("auth/login", {
            title: "Log in",
            values: { email: req.body?.email ?? "" },
            errors: flattenZod(parsed.error),
        });
        return;
    }

    // Explicit .select("+passwordHash") because the schema hides it by default.
    const user = await UserModel.findByEmail(parsed.data.email).select("+passwordHash");
    // Same message + status for both "no such email" and "wrong password" —
    // don't leak which one it was to an attacker enumerating accounts.
    const badCreds = () => {
        res.status(400).render("auth/login", {
            title: "Log in",
            values: { email: parsed.data.email },
            errors: { _: "Email or password is incorrect" },
        });
    };

    if (!user) {
        badCreds();
        return;
    }
    const ok = await (user as any).verifyPassword(parsed.data.password);
    if (!ok) {
        badCreds();
        return;
    }

    const returnTo = req.session.returnTo;
    req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = String(user._id);
        req.session.flash = { type: "success", message: `Welcome back, ${user.name}!` };
        req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            res.redirect(safeReturnTo(returnTo) ?? "/projects");
        });
    });
};

/* --- POST /logout ------------------------------------------------------ */
export const logout: RequestHandler = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect("/");
        return;
    }
    req.session.destroy((err) => {
        if (err) return next(err);
        // Clear the cookie in the browser too so the next request comes in
        // with a fresh, empty session.
        res.clearCookie(SESSION_COOKIE_NAME);
        res.redirect("/");
    });
};

/* --- helpers ----------------------------------------------------------- */

// Refuse any off-site redirects; only allow paths that start with a single
// "/" (rules out "//evil.com" style protocol-relative URLs too).
function safeReturnTo(candidate: string | undefined): string | null {
    if (!candidate) return null;
    if (!candidate.startsWith("/")) return null;
    if (candidate.startsWith("//")) return null;
    return candidate;
}
