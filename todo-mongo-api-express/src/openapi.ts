/* ---------------------------------------------------------------------------
 * src/openapi.ts
 *
 * OpenAPI 3.0 spec for the Mongo-backed Todo API. Swagger UI (mounted at
 * /api-docs by src/middleware/swagger.ts) reads this document and turns it
 * into the browsable, "try it out" docs page.
 *
 * Every path, method, request body, and response type here mirrors exactly
 * one branch in src/routes/todos.ts + src/controllers/todos.ts. If you add a
 * route, add it here too — the docs are only as accurate as this file.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

type OpenApiObject = Record<string, unknown>;

const todoSchema: OpenApiObject = {
    type: "object",
    required: ["id", "title", "completed", "createdAt", "updatedAt"],
    properties: {
        id: {
            type: "string",
            description: "MongoDB ObjectId, 24-char hex.",
            example: "665f1f77bcf86cd799439011",
        },
        title: { type: "string", example: "Learn Mongoose" },
        completed: { type: "boolean", example: false },
        createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-23T12:00:00.000Z",
        },
        updatedAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-23T12:00:00.000Z",
        },
    },
};

const projectSchema: OpenApiObject = {
    type: "object",
    required: ["id", "name", "createdAt", "updatedAt"],
    properties: {
        id: {
            type: "string",
            description: "MongoDB ObjectId, 24-char hex.",
            example: "665f1f77bcf86cd799439012",
        },
        name: { type: "string", example: "Inbox" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

const errorSchema: OpenApiObject = {
    type: "object",
    required: ["error"],
    properties: {
        error: { type: "string", example: "Todo not found" },
    },
};

export const openapi: OpenApiObject = {
    openapi: "3.0.3",
    info: {
        title: "Todo Mongo Express API",
        version: "1.0.0",
        description:
            "Educational Todo REST API built with Express 5 + TypeScript + " +
            "ESM + MongoDB (Mongoose). Endpoints are implemented in " +
            "src/controllers/, wired up in src/routes/, and validated with " +
            "Zod schemas in src/schemas/.",
    },
    servers: [{ url: "/", description: "This server" }],
    tags: [
        { name: "todos", description: "CRUD operations on todos" },
        { name: "projects", description: "CRUD operations on projects (task-manager parent)" },
    ],
    components: {
        schemas: {
            Todo: todoSchema,
            Project: projectSchema,
            Error: errorSchema,
            NewTodo: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Learn Mongoose" },
                    projectId: {
                        type: "string",
                        pattern: "^[a-f\\d]{24}$",
                        description: "Optional parent project.",
                    },
                },
            },
            UpdateTodo: {
                type: "object",
                properties: {
                    title: { type: "string", example: "Learn Mongoose deeply" },
                    completed: { type: "boolean", example: true },
                },
            },
            NewProject: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Inbox" },
                },
            },
            UpdateProject: {
                type: "object",
                properties: {
                    name: { type: "string", example: "Personal" },
                },
            },
        },
    },
    paths: {
        "/api/todos": {
            get: {
                tags: ["todos"],
                summary: "List all todos",
                parameters: [
                    {
                        name: "completed",
                        in: "query",
                        required: false,
                        description:
                            "Optional filter: only completed or only open todos.",
                        schema: { type: "string", enum: ["true", "false"] },
                    },
                    {
                        name: "limit",
                        in: "query",
                        required: false,
                        description: "Page size (1 – 200).",
                        schema: { type: "integer", minimum: 1, maximum: 200 },
                    },
                    {
                        name: "skip",
                        in: "query",
                        required: false,
                        description: "How many documents to skip before returning results.",
                        schema: { type: "integer", minimum: 0 },
                    },
                ],
                responses: {
                    "200": {
                        description: "An array of todos",
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
                tags: ["todos"],
                summary: "Create a new todo",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewTodo" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "The created todo",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": {
                        description: "Missing or malformed request body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                },
            },
        },
        "/api/projects": {
            get: {
                tags: ["projects"],
                summary: "List all projects",
                responses: {
                    "200": {
                        description: "An array of projects",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Project" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["projects"],
                summary: "Create a new project",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewProject" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "The created project",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Project" },
                            },
                        },
                    },
                    "400": {
                        description: "Missing or malformed request body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                },
            },
        },
        "/api/projects/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "The project's 24-char MongoDB ObjectId.",
                    schema: { type: "string", pattern: "^[a-f\\d]{24}$" },
                },
            ],
            get: {
                tags: ["projects"],
                summary: "Fetch one project by id",
                responses: {
                    "200": {
                        description: "The project",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Project" },
                            },
                        },
                    },
                    "400": { description: "Invalid id" },
                    "404": { description: "No project with that id" },
                },
            },
            put: {
                tags: ["projects"],
                summary: "Update fields on an existing project",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateProject" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "The updated project",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Project" },
                            },
                        },
                    },
                    "400": { description: "Invalid id or body" },
                    "404": { description: "No project with that id" },
                },
            },
            delete: {
                tags: ["projects"],
                summary: "Delete a project (cascades to its tasks)",
                responses: {
                    "204": { description: "Deleted (no response body)" },
                    "400": { description: "Invalid id" },
                    "404": { description: "No project with that id" },
                },
            },
        },
        "/api/projects/{id}/tasks": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "The project's 24-char MongoDB ObjectId.",
                    schema: { type: "string", pattern: "^[a-f\\d]{24}$" },
                },
            ],
            get: {
                tags: ["projects", "todos"],
                summary: "List tasks that belong to this project",
                responses: {
                    "200": {
                        description: "An array of todos scoped to the project",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Todo" },
                                },
                            },
                        },
                    },
                    "400": { description: "Invalid project id" },
                    "404": { description: "No project with that id" },
                },
            },
            post: {
                tags: ["projects", "todos"],
                summary: "Create a task nested under this project",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewTodo" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "The created todo, projectId set from the path",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": { description: "Invalid id or body" },
                    "404": { description: "No project with that id" },
                },
            },
        },
        "/api/todos/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "The todo's 24-char MongoDB ObjectId.",
                    schema: { type: "string", pattern: "^[a-f\\d]{24}$" },
                },
            ],
            get: {
                tags: ["todos"],
                summary: "Fetch one todo by id",
                responses: {
                    "200": {
                        description: "The todo",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                    "404": {
                        description: "No todo with that id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ["todos"],
                summary: "Update fields on an existing todo",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateTodo" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "The updated todo",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid id or body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                    "404": {
                        description: "No todo with that id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["todos"],
                summary: "Delete a todo",
                responses: {
                    "204": { description: "Deleted (no response body)" },
                    "400": {
                        description: "Invalid id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                    "404": {
                        description: "No todo with that id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                            },
                        },
                    },
                },
            },
        },
    },
};
