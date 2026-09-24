/* ---------------------------------------------------------------------------
 * src/openapi.ts
 *
 * The OpenAPI 3.0 specification for this API. Swagger UI (mounted at
 * /api-docs by src/middleware/swagger.ts) reads this document and turns it
 * into the browsable, "try it out" docs page.
 *
 * Every path, method, request body, and response type in this file mirrors
 * exactly one branch in src/routes/todos.ts + src/controllers/todos.ts. If
 * you add a route, add it here too — the docs are only as accurate as this
 * file.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

// We don't pull in `openapi-types` just for a type — swagger-ui-express takes
// any plain object. The shape below is the standard OpenAPI 3.0.3 document.
type OpenApiObject = Record<string, unknown>;

const todoSchema: OpenApiObject = {
    type: "object",
    required: ["id", "title", "completed", "createdAt"],
    properties: {
        id: { type: "integer", minimum: 1, example: 1 },
        title: { type: "string", example: "Learn Express 5" },
        completed: { type: "boolean", example: false },
        createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-23T12:00:00.000Z",
        },
    },
};

const studentSchema: OpenApiObject = {
    type: "object",
    required: ["id", "name", "registrationActive", "createdAt"],
    properties: {
        id: { type: "integer", minimum: 1, example: 1 },
        name: { type: "string", example: "Ada Lovelace" },
        registrationActive: { type: "boolean", example: true },
        createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-24T12:00:00.000Z",
        },
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
        title: "Todo Express API",
        version: "1.0.0",
        description:
            "Educational Todo REST API built with Express 5 + TypeScript + ESM. " +
            "Every endpoint below is implemented by the controllers in src/controllers/, " +
            "wired up in src/routes/, and validated with Zod schemas in src/schemas/.",
    },
    servers: [{ url: "/", description: "This server" }],
    tags: [
        { name: "todos", description: "CRUD operations on todos" },
        { name: "students", description: "CRUD operations on students" },
    ],
    components: {
        schemas: {
            Todo: todoSchema,
            Student: studentSchema,
            Error: errorSchema,
            NewTodo: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Learn Express" },
                },
            },
            UpdateTodo: {
                type: "object",
                properties: {
                    title: { type: "string", example: "Learn Express deeply" },
                    completed: { type: "boolean", example: true },
                },
            },
            NewStudent: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Ada Lovelace" },
                },
            },
            UpdateStudent: {
                type: "object",
                properties: {
                    name: { type: "string", example: "Grace Hopper" },
                    registrationActive: { type: "boolean", example: true },
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
        "/api/students": {
            get: {
                tags: ["students"],
                summary: "List all students",
                parameters: [
                    {
                        name: "registrationActive",
                        in: "query",
                        required: false,
                        description: "Optional filter for active registration status.",
                        schema: { type: "string", enum: ["true", "false"] },
                    },
                ],
                responses: {
                    "200": {
                        description: "An array of students",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Student" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["students"],
                summary: "Create a new student",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewStudent" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "The created student",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Student" },
                            },
                        },
                    },
                },
            },
        },
        "/api/students/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "The student's positive-integer id.",
                    schema: { type: "integer", minimum: 1 },
                },
            ],
            get: {
                tags: ["students"],
                summary: "Fetch one student by id",
                responses: {
                    "200": {
                        description: "The student",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Student" },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ["students"],
                summary: "Update a student",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateStudent" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "The updated student",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Student" },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["students"],
                summary: "Delete a student",
                responses: {
                    "204": { description: "Deleted (no response body)" },
                },
            },
        },
    },
};
