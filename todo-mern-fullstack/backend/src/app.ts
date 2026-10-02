/* =============================================================================
 * src/app.ts — Express application assembly
 * =============================================================================
 *
 * The Express **app** is the composition of middleware and routes. We build
 * it in a factory function (`createApp()`) so tests can create a fresh app
 * instance without starting an HTTP server.
 *
 * Middleware order matters! Each `app.use(...)` runs in order for every
 * matching request. The convention:
 *
 *     1. Logging        → see every request
 *     2. CORS           → set headers BEFORE handlers reply
 *     3. Body parsing   → populate req.body
 *     4. API routes     → the real work
 *     5. Not-found      → catch unmatched paths
 *     6. Error handler  → convert errors to JSON (MUST be last)
 *
 * @author Bill Chen
 * ===========================================================================
 */

import express, { type Express } from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/index.js";
import { todosRouter } from "./routes/todos.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { openApiSpec } from "./openapi.js";

export function createApp(): Express {
    const app = express();

    /* ------------------------------------------------------------------
     * 1. Request logging — morgan prints "GET /api/todos 200 7ms".
     *    Use the "dev" format in dev, the "combined" (Apache-style)
     *    format in prod — the latter is machine-parseable for log tools.
     * ---------------------------------------------------------------- */
    app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

    /* ------------------------------------------------------------------
     * 2. CORS — allows the React dev server (different port) to call us.
     *    Without this the browser blocks the fetch with a CORS error.
     *    In production you'd set `origin` to your deployed frontend URL.
     * ---------------------------------------------------------------- */
    app.use(
        cors({
            origin: config.clientOrigin,
            credentials: false, // we don't use cookies in this learning app
        }),
    );

    /* ------------------------------------------------------------------
     * 3. Body parsers — Express 5 ships them, no body-parser dep needed.
     *    `json()` parses `Content-Type: application/json`.
     * ---------------------------------------------------------------- */
    app.use(express.json({ limit: "100kb" }));
    app.use(express.urlencoded({ extended: true }));

    /* ------------------------------------------------------------------
     * 4a. Home page — a tiny HTML landing page so hitting the server
     *     root in a browser shows something useful (links to the docs,
     *     the health probe, and the raw API) instead of a 404.
     * ---------------------------------------------------------------- */
    app.get("/", (_req, res) => {
        res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Todo API</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
  code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
  li { margin: 0.3rem 0; }
</style>
</head>
<body>
  <h1>Todo API</h1>
  <p>Backend is running (<code>${config.nodeEnv}</code>).</p>
  <ul>
    <li><a href="/api-docs">/api-docs</a> — interactive Swagger UI</li>
    <li><a href="/api-docs.json">/api-docs.json</a> — raw OpenAPI spec</li>
    <li><a href="/api/todos">/api/todos</a> — list todos</li>
    <li><a href="/health">/health</a> — liveness probe</li>
  </ul>
</body>
</html>`);
    });

    /* ------------------------------------------------------------------
     * 4b. Simple health check — handy for Docker / Kubernetes probes
     *    and for quickly confirming the server is alive.
     * ---------------------------------------------------------------- */
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", uptime: process.uptime() });
    });

    /* ------------------------------------------------------------------
     * 5. API routes — mount sub-routers under their URL prefix.
     * ---------------------------------------------------------------- */
    app.use("/api/todos", todosRouter);

    /* ------------------------------------------------------------------
     * 5b. Interactive API docs — Swagger UI at /api-docs, raw spec at
     *     /api-docs.json. Mount AFTER the real routes but BEFORE the
     *     404 handler so the swagger paths actually resolve.
     * ---------------------------------------------------------------- */
    app.get("/api-docs.json", (_req, res) => {
        res.json(openApiSpec);
    });
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(openApiSpec, {
            customSiteTitle: "Todo API — Swagger UI",
        }),
    );

    /* ------------------------------------------------------------------
     * 6. Fall-through: anything else is a 404, then the error handler.
     *    The error handler goes LAST — Express identifies it by its
     *    four-argument signature.
     * ---------------------------------------------------------------- */
    app.use(notFound);
    app.use(errorHandler);

    return app;
}
