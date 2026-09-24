/* ---------------------------------------------------------------------------
 * src/middleware/swagger.js
 *
 * Mounts Swagger UI at /api-docs. Serves three things:
 *
 *   GET /api-docs/            -> a small HTML page that boots Swagger UI
 *   GET /api-docs/swagger.json -> our OpenAPI spec (src/openapi.js) as JSON
 *   GET /api-docs/<asset>     -> static assets shipped by swagger-ui-dist
 *                                (swagger-ui-bundle.js, swagger-ui.css, ...)
 *
 * How it works
 * ------------
 * `swagger-ui-dist` is a package that ships the compiled Swagger UI web app
 * as plain static files. `swagger-ui-dist/getAbsoluteFSPath()` returns the
 * directory those files live in on disk. We use `serve-static` — the same
 * Express-team static-file middleware Express uses under the hood — to
 * serve them.
 *
 * We deliberately do NOT use `swagger-ui-express`. That package hard-depends
 * on Express's `res.send()` and would defeat the point of this project.
 * Everything here is plain Connect middleware.
 *
 * The index.html shipped by swagger-ui-dist points at the Petstore demo API
 * by default. We ignore that file and serve our own tiny HTML shell that
 * boots the UI against /api-docs/swagger.json instead.
 *
 * Mount behaviour
 * ---------------
 * This middleware is mounted with `app.use("/api-docs", swagger)` in
 * src/app.js. When a request comes in for `/api-docs/foo.css`, Connect
 * temporarily rewrites `req.url` to `/foo.css` for the duration of this
 * middleware, then restores it afterwards. So inside this function we only
 * care about paths RELATIVE to the mount point.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const serveStatic = require("serve-static");
const swaggerUiDist = require("swagger-ui-dist");
const openapi = require("../openapi");

// Directory on disk containing swagger-ui.css, swagger-ui-bundle.js, etc.
const UI_ASSETS_DIR = swaggerUiDist.getAbsoluteFSPath();

// serve-static returns a Connect-compatible (req, res, next) middleware.
// `index: false` disables its "look for index.html" behaviour so we can
// serve our own index above.
const staticServe = serveStatic(UI_ASSETS_DIR, { index: false });

// Precompute the spec as a JSON string so we don't re-serialize on every
// request. openapi is a plain JS object — cheap to import, expensive-ish
// to stringify.
const SPEC_JSON = JSON.stringify(openapi);

// Minimal HTML shell that boots Swagger UI against our spec. All asset
// URLs are relative so they resolve to /api-docs/<file>, which lands back
// in this same middleware and is handled by serveStatic below.
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Todo Connect API — Swagger UI</title>
    <link rel="stylesheet" href="./swagger-ui.css" />
    <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
    <style>
        body { margin: 0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="./swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
        window.onload = function () {
            window.ui = SwaggerUIBundle({
                url: "./swagger.json",
                dom_id: "#swagger-ui",
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset,
                ],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: "StandaloneLayout",
            });
        };
    </script>
</body>
</html>
`;

function swagger(req, res, next) {
    // Only GET/HEAD make sense for a docs UI. Anything else falls through
    // to the next middleware, which will eventually 404.
    if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
    }

    // req.url is relative to the mount point ("/api-docs"). Connect will
    // pass us "" or "/" for the mount root itself.
    if (req.url === "" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(INDEX_HTML);
    }

    if (req.url === "/swagger.json") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(SPEC_JSON);
    }

    // Everything else (css/js/png/...) is a static asset from swagger-ui-dist.
    staticServe(req, res, next);
}

module.exports = swagger;
