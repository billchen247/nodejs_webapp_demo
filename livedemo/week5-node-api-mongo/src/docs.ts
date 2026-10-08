import express from "express";
import { randomBytes } from "node:crypto";

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
          200: {
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
          200: {
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
    "/api/v1/projects": {
      get: {
        summary: "List projects",
        description: "List projects, optionally filtering by an exact project name.",
        parameters: [{
          name: "name",
          in: "query",
          required: false,
          schema: { type: "string", minLength: 1, maxLength: 200 },
          description: "Exact project name to match.",
        }],
        responses: {
          200: {
            description: "Projects, newest first",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Project" },
                },
              },
            },
          },
          400: { description: "Invalid project query" },
        },
      },
      post: {
        summary: "Create a project",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Project created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          400: { description: "Invalid project" },
        },
      },
    },
    "/api/v1/projects/{id}": {
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
      }],
      get: {
        summary: "Get a project",
        responses: {
          200: {
            description: "Project found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          400: { description: "Invalid project id" },
          404: { description: "Project not found" },
        },
      },
      put: {
        summary: "Replace a project",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Project replaced",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          400: { description: "Invalid id or project" },
          404: { description: "Project not found" },
        },
      },
      patch: {
        summary: "Update fields on a project",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectPatch" },
            },
          },
        },
        responses: {
          200: {
            description: "Project updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          400: { description: "Invalid id or project" },
          404: { description: "Project not found" },
        },
      },
      delete: {
        summary: "Delete a project",
        responses: {
          204: { description: "Project deleted" },
          400: { description: "Invalid project id" },
          404: { description: "Project not found" },
        },
      },
    },
    "/api/v1/todos": {
      get: {
        summary: "List todos",
        responses: {
          200: {
            description: "Todos, newest first",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Todo" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a todo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TodoInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Todo created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Todo" },
              },
            },
          },
          400: { description: "Invalid todo" },
        },
      },
    },
    "/api/v1/todos/{id}": {
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
      }],
      get: {
        summary: "Get a todo",
        responses: {
          200: {
            description: "Todo found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Todo" },
              },
            },
          },
          400: { description: "Invalid todo id" },
          404: { description: "Todo not found" },
        },
      },
      put: {
        summary: "Replace a todo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TodoInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Todo replaced",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Todo" },
              },
            },
          },
          400: { description: "Invalid id or todo" },
          404: { description: "Todo not found" },
        },
      },
      patch: {
        summary: "Update fields on a todo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TodoPatch" },
            },
          },
        },
        responses: {
          200: {
            description: "Todo updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Todo" },
              },
            },
          },
          400: { description: "Invalid id or todo" },
          404: { description: "Todo not found" },
        },
      },
      delete: {
        summary: "Delete a todo",
        responses: {
          204: { description: "Todo deleted" },
          400: { description: "Invalid todo id" },
          404: { description: "Todo not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      ProjectInput: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            pattern: ".*[A-Za-z].*",
            description: "Must contain at least one letter.",
          },
          description: { type: "string", maxLength: 2000, default: "" },
        },
        required: ["name"],
        additionalProperties: false,
      },
      ProjectPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            pattern: ".*[A-Za-z].*",
            description: "Must contain at least one letter.",
          },
          description: { type: "string", maxLength: 2000 },
        },
        additionalProperties: false,
      },
      Project: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["_id", "name", "description", "createdAt", "updatedAt"],
        additionalProperties: false,
      },
      TodoInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000, default: "" },
          completed: { type: "boolean", default: false },
        },
        required: ["title"],
        additionalProperties: false,
      },
      TodoPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          completed: { type: "boolean" },
        },
        additionalProperties: false,
      },
      Todo: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          completed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["_id", "title", "description", "completed", "createdAt", "updatedAt"],
        additionalProperties: false,
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
