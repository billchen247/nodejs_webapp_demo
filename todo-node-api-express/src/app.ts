/* ---------------------------------------------------------------------------
 * src/app.ts
 *
 * Assembles the Express application. The order below is deliberate; comments
 * on each `.use(...)` explain why it lives where it does.
 *
 * What Express 5 buys you vs the two sister projects
 * --------------------------------------------------
 *   * A real router — `app.get("/api/todos/:id", handler)` instead of the
 *     hand-rolled `if (segments[0] === "api" && ...)` in raw http / Connect.
 *   * Async errors just work — a route handler that throws or rejects a
 *     Promise is forwarded to the error middleware automatically. In
 *     Express 4 you needed `express-async-errors`; not any more.
 *   * `res.status(x).json(...)` instead of writeHead + JSON.stringify + end.
 *   * Method-not-allowed (405) is handled by the router: if you defined
 *     `.get(...)` and `.post(...)` on `/api/todos`, a `PATCH` to that URL
 *     returns 405 automatically, with an accurate `Allow` header.
 *
 * The rest — CORS, body parsing, security headers, request logging —
 * comes from small, single-purpose middleware packages.
 * -------------------------------------------------------------------------*/

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { ALLOWED_ORIGIN, IS_TEST } from "./config.js";
import { todosRouter } from "./routes/todos.js";
import { showHomePage } from "./controllers/home.js";
import { createSwaggerRouter } from "./middleware/swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

export function createApp(): Express {
    const app = express();

    // Trust proxy headers when deployed behind a reverse proxy (nginx, ELB,
    // Cloudflare). Safe default: `1` = trust one hop.
    app.set("trust proxy", 1);

    // Disable the "X-Powered-By: Express" fingerprint header. Cheap win.
    app.disable("x-powered-by");

    /* --- security & platform middleware ---------------------------------- */

    // Helmet sets ~15 hardening HTTP headers (CSP, HSTS, X-Frame-Options, ...).
    // Its CSP defaults are strict, so we relax them just enough for Swagger
    // UI's inline styles to render — everything else stays locked down.
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                    "script-src": ["'self'", "'unsafe-inline'"],
                    "style-src": ["'self'", "'unsafe-inline'"],
                    "img-src": ["'self'", "data:", "https:"],
                },
            },
        })
    );

    // CORS: allow the future React dev server (see config.ts) to call the
    // API from the browser. `cors()` handles the OPTIONS preflight for us —
    // in raw-http and Connect we had to do that by hand.
    app.use(
        cors({
            origin: ALLOWED_ORIGIN,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type"],
            maxAge: 600,
        })
    );

    // Basic per-IP rate limit. In a real deployment you'd want this tuned per
    // route, but 300 req/min is a fine belt-and-braces default for a learning
    // API. Skipped under NODE_ENV=test so vitest doesn't trip it.
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

    // Request logging. `dev` colours by status. Silenced under NODE_ENV=test
    // so test output stays clean.
    if (!IS_TEST) app.use(morgan("dev"));

    // Parse application/json bodies into `req.body`. Rejecting anything > 1MB
    // is a defensive default — this API only accepts a { title } object.
    app.use(express.json({ limit: "1mb" }));

    /* --- routes ---------------------------------------------------------- */

    // Landing page.
    app.get("/", showHomePage);

    // Swagger UI + raw OpenAPI JSON, mounted at /api-docs.
    app.use("/api-docs", createSwaggerRouter());

    // The Todos REST resource.
    app.use("/api/todos", todosRouter);

    /* --- terminal handlers ----------------------------------------------- */

    // Anything the router chain didn't match ends here as a JSON 404.
    app.use(notFoundHandler);

    // Any thrown error / next(err) is turned into a JSON error response.
    app.use(errorHandler);

    return app;
}
