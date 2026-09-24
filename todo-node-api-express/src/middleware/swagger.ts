/* ---------------------------------------------------------------------------
 * src/middleware/swagger.ts
 *
 * Mounts Swagger UI at /api-docs. Serves three things:
 *
 *   GET /api-docs/            -> the Swagger UI web app (HTML/CSS/JS)
 *   GET /api-docs/swagger.json -> our OpenAPI spec (src/openapi.ts) as JSON
 *
 * How it works
 * ------------
 * `swagger-ui-express` is Express's official-ish adapter for Swagger UI. It
 * ships the static UI assets and exposes:
 *
 *     swaggerUi.serve       — an Express middleware that serves the assets
 *     swaggerUi.setup(spec) — a middleware that renders the boot HTML
 *                             pointed at `spec`
 *
 * In the Connect sister project we set this up by hand using
 * `swagger-ui-dist` + `serve-static` (because `swagger-ui-express` depends on
 * Express-specific helpers). Here we can just use the package directly.
 *
 * The /swagger.json endpoint is a nice-to-have: some tooling (Postman, code
 * generators, docs aggregators) expects the raw spec at a well-known URL.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { Router } from "express";
import { Router as makeRouter } from "express";
import swaggerUi from "swagger-ui-express";
import { openapi } from "../openapi.js";

export function createSwaggerRouter(): Router {
    const router = makeRouter();

    // Raw JSON endpoint FIRST so it isn't swallowed by the setup middleware.
    router.get("/swagger.json", (_req, res) => {
        res.json(openapi);
    });

    // swaggerUi.serve is an array of middlewares that serve the static assets;
    // swaggerUi.setup returns the middleware that renders the boot HTML.
    router.use(swaggerUi.serve);
    router.get(
        "/",
        swaggerUi.setup(openapi, {
            customSiteTitle: "Todo Express API — Swagger UI",
        })
    );

    return router;
}
