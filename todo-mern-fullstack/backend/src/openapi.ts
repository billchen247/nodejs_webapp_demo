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
        { name: "Authentication", description: "Account registration and sessions" },
        { name: "Profile", description: "Current authenticated user" },
        { name: "Todos", description: "CRUD operations on todo items" },
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "token",
                description: "Short-lived HttpOnly JWT cookie.",
            },
        },
        schemas: {
            User: {
                type: "object",
                required: ["id", "name", "email", "role"],
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: { type: "string", example: "student" },
                },
            },
            RegisterInput: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 100 },
                    email: { type: "string", format: "email", maxLength: 254 },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                },
            },
            LoginInput: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", maxLength: 254 },
                    password: { type: "string", minLength: 1, maxLength: 128 },
                },
            },
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
        "/api/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register a student account and sign in",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Account created; JWT set in an HttpOnly cookie.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { user: { $ref: "#/components/schemas/User" } },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "409": { description: "Email address is already registered." },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Verify credentials and sign in",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Signed in; JWT set in an HttpOnly cookie.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { user: { $ref: "#/components/schemas/User" } },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { description: "Invalid email or password." },
                },
            },
        },
        "/api/auth/logout": {
            post: {
                tags: ["Authentication"],
                summary: "Clear the authentication cookie",
                responses: {
                    "200": { description: "Signed out." },
                },
            },
        },
        "/api/profile": {
            get: {
                tags: ["Profile"],
                summary: "Get the current authenticated user's profile",
                security: [{ cookieAuth: [] }],
                responses: {
                    "200": {
                        description: "Current user.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { user: { $ref: "#/components/schemas/User" } },
                                },
                            },
                        },
                    },
                    "401": { description: "Authentication required." },
                },
            },
        },
        "/api/todos": {
            get: {
                tags: ["Todos"],
                summary: "List all todos (newest first)",
                security: [{ cookieAuth: [] }],
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
                security: [{ cookieAuth: [] }],
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
                security: [{ cookieAuth: [] }],
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
                security: [{ cookieAuth: [] }],
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
                security: [{ cookieAuth: [] }],
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
