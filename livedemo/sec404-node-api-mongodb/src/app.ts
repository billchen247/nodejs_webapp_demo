import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import * as middlewares from "./middlewares.js";
import openApiSpec from "./openapi.js";
import routes from "./routes/index.js";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api-docs/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/api-docs", (_req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; font-src 'self' data: https://unpkg.com; img-src 'self' data: https://validator.swagger.io; connect-src 'self'",
  );
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SEC404 Node API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
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

app.use(routes);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
