/* =============================================================================
 * src/openapi.ts — OpenAPI 3.0 specification for the Todo REST API
 * =============================================================================
 *
 * Hand-written OpenAPI document that describes every endpoint the Express
 * app exposes. We ship it as a plain object (not YAML) so TypeScript catches
 * typos at compile time and `swagger-ui-express` can serve it directly.
 *
 * Visit the live docs at:  http://localhost:4000/api-docs
 *
 * @author Bill Chen
 * ===========================================================================
 */

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Todo MERN Fullstack API",
        version: "1.0.0",
        description:
            "Express 5 + MongoDB (Mongoose) REST API for a learning-oriented MERN todo app.",
        license: { name: "MIT" },
    },
    servers: [
        { url: "http://localhost:4000", description: "Local dev server" },
    ],
    tags: [
        { name: "Health", description: "Liveness probe" },
        { name: "Todos", description: "CRUD operations on todo items" },
    ],
    components: {
        schemas: {
            Todo: {
                type: "object",
                required: ["id", "title", "completed", "createdAt", "updatedAt"],
                properties: {
                    id: {
                        type: "string",
                        description: "Mongo ObjectId as a 24-char hex string.",
                        example: "6711c5a1f1b2a3d4e5f6a7b8",
                    },
                    title: { type: "string", minLength: 1, maxLength: 200 },
                    completed: { type: "boolean", default: false },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CreateTodoInput: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", minLength: 1, maxLength: 200 },
                    completed: { type: "boolean" },
                },
            },
            UpdateTodoInput: {
                type: "object",
                minProperties: 1,
                properties: {
                    title: { type: "string", minLength: 1, maxLength: 200 },
                    completed: { type: "boolean" },
                },
            },
            Error: {
                type: "object",
                required: ["error"],
                properties: {
                    error: { type: "string" },
                    details: {},
                },
            },
            Health: {
                type: "object",
                required: ["status", "uptime"],
                properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number", description: "Seconds since start." },
                },
            },
        },
        parameters: {
            TodoId: {
                name: "id",
                in: "path",
                required: true,
                description: "Mongo ObjectId (24 hex chars).",
                schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
            },
        },
        responses: {
            BadRequest: {
                description: "Validation failed.",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            NotFound: {
                description: "Resource not found.",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Liveness probe",
                responses: {
                    "200": {
                        description: "Server is alive.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Health" },
                            },
                        },
                    },
                },
            },
        },
        "/api/todos": {
            get: {
                tags: ["Todos"],
                summary: "List all todos (newest first)",
                responses: {
                    "200": {
                        description: "Array of todos.",
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
                tags: ["Todos"],
                summary: "Create a new todo",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateTodoInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                },
            },
        },
        "/api/todos/{id}": {
            get: {
                tags: ["Todos"],
                summary: "Fetch one todo by id",
                parameters: [{ $ref: "#/components/parameters/TodoId" }],
                responses: {
                    "200": {
                        description: "The todo.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
            patch: {
                tags: ["Todos"],
                summary: "Partially update a todo",
                parameters: [{ $ref: "#/components/parameters/TodoId" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateTodoInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Updated todo.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Todo" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
            delete: {
                tags: ["Todos"],
                summary: "Delete a todo",
                parameters: [{ $ref: "#/components/parameters/TodoId" }],
                responses: {
                    "204": { description: "Deleted." },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
    },
} as const;
