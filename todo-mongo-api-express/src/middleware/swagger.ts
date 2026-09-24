/* ---------------------------------------------------------------------------
 * src/middleware/swagger.ts
 *
 * Mounts Swagger UI at /api-docs. Serves three things:
 *
 *   GET /api-docs/            -> the Swagger UI web app (HTML/CSS/JS)
 *   GET /api-docs/swagger.json -> our OpenAPI spec (src/openapi.ts) as JSON
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

    router.use(swaggerUi.serve);
    router.get(
        "/",
        swaggerUi.setup(openapi, {
            customSiteTitle: "Todo Mongo Express API — Swagger UI",
        })
    );

    return router;
}
