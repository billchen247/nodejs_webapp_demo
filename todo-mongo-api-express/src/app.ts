/* ---------------------------------------------------------------------------
 * src/app.ts
 *
 * Assembles the Express application. Middleware is deliberately ordered:
 *   security   -> CORS -> rate-limit -> compression -> log -> body parse
 *   -> routes  -> notFound -> errorHandler
 *
 * The MongoDB connection lifecycle lives OUTSIDE this function — it belongs
 * to whoever starts the process (server.ts in prod, the test suite in tests).
 * That keeps `createApp()` synchronous and easy to reuse.
 * @author Bill Chen
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

    // Trust one hop of proxy headers — safe default behind nginx / ELB / CF.
    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    /* --- security & platform middleware ---------------------------------- */

    // Relax CSP just enough for Swagger UI's inline styles; leave the rest
    // of Helmet's ~15 hardening headers on.
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

    // CORS: allow the future React dev server to call the API from the
    // browser. `cors()` handles the OPTIONS preflight for us.
    app.use(
        cors({
            origin: ALLOWED_ORIGIN,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type"],
            maxAge: 600,
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

    // Parse application/json bodies. 1 MB is a generous ceiling for a Todo API.
    app.use(express.json({ limit: "1mb" }));

    /* --- routes ---------------------------------------------------------- */

    app.get("/", showHomePage);
    app.use("/api-docs", createSwaggerRouter());
    app.use("/api/todos", todosRouter);

    /* --- terminal handlers ----------------------------------------------- */

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
