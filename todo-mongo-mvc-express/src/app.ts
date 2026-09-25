/* ---------------------------------------------------------------------------
 * src/app.ts
 *
 * Assembles the Express application, wires up the EJS view engine, sessions,
 * auth middleware, and every top-level router.
 *
 * Middleware order (top → bottom = first → last):
 *
 *   security (Helmet)         →
 *   rate-limit                →
 *   compression + logging     →
 *   body/form parsers         →
 *   method-override           →
 *   static assets             →
 *   session                   →
 *   flash (uses session)      →
 *   injectCurrentUser (uses session + DB) →
 *   routes                    →
 *   notFound → errorHandler
 *
 * The MongoDB connection lifecycle lives OUTSIDE this function — it belongs
 * to whoever starts the process (server.ts in prod, the test suite in tests).
 * That keeps `createApp()` synchronous and easy to reuse.
 *
 * Server-side rendering
 * ---------------------
 * We use EJS — HTML with a bit of `<% %>` — because it's the shallowest
 * learning curve on top of plain HTML. `res.render("todos/index", locals)`
 * looks up `views/todos/index.ejs` and pipes the rendered HTML back to the
 * client.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import methodOverride from "method-override";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

import {
    IS_TEST,
    IS_PROD,
    SESSION_SECRET,
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_MS,
} from "./config.js";
import { todosRouter } from "./routes/todos.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { usersRouter } from "./routes/users.js";
import { showHomePage } from "./controllers/home.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { injectCurrentUser } from "./middleware/auth.js";
import { flash } from "./middleware/flash.js";

// Resolve /views and /public relative to THIS file so the app works the same
// whether it's launched via `tsx src/server.ts` or `node dist/server.js`.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

export function createApp(): Express {
    const app = express();

    // Trust one hop of proxy headers — safe default behind nginx / ELB / CF.
    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    /* --- view engine ----------------------------------------------------- */

    // Point Express at the EJS engine and the /views directory. Every call
    // to `res.render("foo/bar", locals)` resolves to `views/foo/bar.ejs`.
    app.set("view engine", "ejs");
    app.set("views", path.join(PROJECT_ROOT, "views"));

    /* --- security & platform middleware ---------------------------------- */

    // Helmet's default CSP forbids inline styles; our EJS templates use a
    // small inline <style> block for demo simplicity. Relax just those two
    // directives and keep the rest of Helmet's hardening on.
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                    "script-src": ["'self'", "'unsafe-inline'"],
                    "style-src": ["'self'", "'unsafe-inline'"],
                    "img-src": ["'self'", "data:", "https:"],
                    // Forms POST back to the same origin; the default policy already allows it.
                },
            },
        })
    );

    // Basic per-IP rate limit. Skipped under NODE_ENV=test so vitest doesn't
    // trip it during the suite.
    if (!IS_TEST) {
        app.use(
            rateLimit({
                windowMs: 60_000,
                max: 300,
                standardHeaders: true,
                legacyHeaders: false,
            })
        );
    }

    // gzip/deflate response compression.
    app.use(compression());

    // Request logging. Silenced under NODE_ENV=test.
    if (!IS_TEST) app.use(morgan("dev"));

    /* --- request parsers ------------------------------------------------- */

    // HTML forms submit as application/x-www-form-urlencoded — this is the
    // parser we need for the create/update flow. We also enable express.json()
    // so `curl -d '{...}'` still works during learning.
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));
    app.use(express.json({ limit: "1mb" }));

    // HTML forms only support GET and POST. `method-override` lets a form
    // include a hidden field like `<input name="_method" value="DELETE">` and
    // have Express treat the request as a real DELETE.
    app.use(methodOverride("_method"));

    /* --- static assets --------------------------------------------------- */

    // Anything in /public is served at the URL root: /styles.css, /favicon.ico, ...
    app.use(express.static(path.join(PROJECT_ROOT, "public"), { maxAge: IS_TEST ? 0 : "1h" }));

    /* --- session --------------------------------------------------------- */

    // Sessions are stored server-side in MongoDB (via connect-mongo) so a
    // process restart doesn't log everyone out. In test mode we skip the store
    // config and fall back to express-session's in-process MemoryStore, which
    // is exactly what we want for hermetic tests.
    const sessionOptions: session.SessionOptions = {
        secret: SESSION_SECRET,
        name: SESSION_COOKIE_NAME,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: IS_PROD,
            maxAge: SESSION_MAX_AGE_MS,
        },
    };
    if (!IS_TEST) {
        // Reuse Mongoose's live MongoClient so we don't open a second
        // connection just for sessions. `connectToDatabase()` must have run
        // before `createApp()` — which is exactly what server.ts does.
        sessionOptions.store = MongoStore.create({
            client: mongoose.connection.getClient() as unknown as Parameters<
                typeof MongoStore.create
            >[0]["client"],
            collectionName: "sessions",
            ttl: Math.floor(SESSION_MAX_AGE_MS / 1000),
            touchAfter: 60, // rate-limit "just touched" updates to once/minute
        });
    }
    app.use(session(sessionOptions));

    // One-time flash message copy from session → res.locals.
    app.use(flash);

    // Populate `req.currentUser` and `res.locals.currentUser` on every request.
    app.use(injectCurrentUser);

    /* --- routes ---------------------------------------------------------- */

    app.get("/", showHomePage);
    app.use("/", authRouter);                 // /signup, /login, /logout
    app.use("/users", usersRouter);           // requires auth
    app.use("/projects", projectsRouter);     // requires auth; nests /tasks
    app.use("/todos", todosRouter);           // legacy demo — open access

    /* --- terminal handlers ----------------------------------------------- */

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
