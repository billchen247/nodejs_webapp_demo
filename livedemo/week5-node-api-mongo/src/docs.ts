import { randomBytes } from "node:crypto";
import express from "express";

const router = express.Router();

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Week 5 Node API",
    version: "1.0.0",
    description: "API documentation for the Week 5 Node.js and MongoDB project.",
  },
  paths: {
    "/api/v1": {
      get: {
        summary: "Get the API welcome message",
        responses: {
          "200": {
            description: "API welcome message",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                  required: ["message"],
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/emojis": {
      get: {
        summary: "List example emojis",
        responses: {
          "200": {
            description: "An array of emojis",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

router.use((_req, res, next) => {
  const nonce = randomBytes(16).toString("base64");
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'none'; script-src 'self' 'nonce-${nonce}' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data:; font-src 'self' data: https://unpkg.com; connect-src 'self'`,
  );
  res.locals.swaggerNonce = nonce;
  next();
});

router.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

router.get("/", (_req, res) => {
  const nonce = res.locals.swaggerNonce as string;

  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Week 5 Node API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script nonce="${nonce}">
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api-docs/openapi.json",
          dom_id: "#swagger-ui",
        });
      };
    </script>
  </body>
</html>`);
});

export default router;
