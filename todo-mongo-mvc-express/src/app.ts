/* ---------------------------------------------------------------------------
 * src/app.ts
 *
 * Assembles the Express application, wires up the EJS view engine, and mounts
 * the /todos router. Middleware order:
 *
 *   security → rate-limit → compression → log → body/form parse →
 *   method-override → static assets → routes → notFound → errorHandler
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
import { IS_TEST } from "./config.js";
import { todosRouter } from "./routes/todos.js";
import { showHomePage } from "./controllers/home.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

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

    /* --- routes ---------------------------------------------------------- */

    app.get("/", showHomePage);
    app.use("/todos", todosRouter);

    /* --- terminal handlers ----------------------------------------------- */

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
