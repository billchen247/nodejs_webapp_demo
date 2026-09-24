/* ---------------------------------------------------------------------------
 * src/openapi.js
 *
 * The OpenAPI 3.0 specification for this API. Swagger UI reads this document
 * and turns it into the browsable, "try it out" docs page you see at
 * /api-docs/.
 *
 * OpenAPI (formerly "Swagger") is a JSON/YAML format for describing HTTP
 * APIs. In a large project you'd usually keep it in a separate .yaml file;
 * we inline it as a JS object so students can jump straight from a controller
 * to the schema that documents it.
 *
 * Every path, method, request body, and response type in this file mirrors
 * exactly one branch in src/router.js + src/controllers/todos.js. If you add
 * a route, add it here too — the docs are only as accurate as this file.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const todoSchema = {
    type: "object",
    required: ["id", "title", "completed", "createdAt"],
    properties: {
        id: { type: "integer", minimum: 1, example: 1 },
        title: { type: "string", example: "Learn Connect middleware" },
        completed: { type: "boolean", example: false },
        createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-23T12:00:00.000Z",
        },
    },
};

const errorSchema = {
    type: "object",
    required: ["error"],
    properties: {
        error: { type: "string", example: "Todo not found" },
    },
};

const openapi = {
    openapi: "3.0.3",
    info: {
        title: "Todo Connect API",
        version: "1.0.0",
        description:
            "Educational Todo REST API built on the Connect middleware framework. " +
            "Every endpoint below is implemented by the controllers in src/controllers/.",
    },
    servers: [
        { url: "/", description: "This server" },
    ],
    tags: [
        { name: "todos", description: "CRUD operations on todos" },
    ],
    components: {
        schemas: {
            Todo: todoSchema,
            Error: errorSchema,
            NewTodo: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Learn Connect" },
                },
            },
            UpdateTodo: {
                type: "object",
                properties: {
                    title: { type: "string", example: "Learn Connect deeply" },
                    completed: { type: "boolean", example: true },
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
                        description: "Optional filter: only completed or only open todos.",
                        schema: { type: "string", enum: ["true", "false"] },
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
        "/api/todos/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "The todo's positive-integer id.",
                    schema: { type: "integer", minimum: 1 },
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

module.exports = openapi;
