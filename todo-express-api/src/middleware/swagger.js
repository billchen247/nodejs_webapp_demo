/* ---------------------------------------------------------------------------
 * src/middleware/swagger.js
 *
 * Mounts Swagger UI at /api-docs using the `swagger-ui-express` package.
 * The Express ecosystem includes an official integration, so a single
 * `swaggerUi.setup(spec)` call replaces the manual HTML shell + static-file
 * plumbing we wrote in ../todo-connect-api/src/middleware/swagger.js.
 *
 * Endpoints exposed under /api-docs:
 *
 *   GET /api-docs/            -> Swagger UI page (rendered against the spec)
 *   GET /api-docs/swagger.json -> our OpenAPI spec as JSON
 *   GET /api-docs/<asset>     -> swagger-ui-dist static assets (via swagger-ui-express)
 * -------------------------------------------------------------------------*/

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("../openapi");

const router = express.Router();

// Expose the raw spec so tests (and tools like Postman/Insomnia) can fetch
// it without scraping the HTML. Mirrors ../todo-connect-api's /api-docs/swagger.json.
router.get("/swagger.json", (req, res) => {
    res.json(openapi);
});

// swaggerUi.serve is an array of static-file middlewares; setup() returns
// the middleware that renders the actual HTML page against our spec.
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(openapi));

module.exports = router;
