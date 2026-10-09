const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SEC404 Node API",
    version: "1.0.0",
    description: "REST API for the SEC404 Node.js and MongoDB demo.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/": {
      get: {
        summary: "Get API status",
        responses: {
          "200": {
            description: "API status message",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
              },
            },
          },
        },
      },
    },
    "/emojis": {
      get: {
        summary: "List sample emojis",
        responses: {
          "200": {
            description: "Emoji list",
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
    "/todos": {
      get: {
        summary: "List todos",
        parameters: [
          {
            in: "query",
            name: "completed",
            schema: { type: "boolean" },
            description: "Filter by completion status.",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 200 },
            description: "Maximum number of todos to return.",
          },
          {
            in: "query",
            name: "skip",
            schema: { type: "integer", minimum: 0 },
            description: "Number of todos to skip.",
          },
        ],
        responses: {
          "200": {
            description: "Todos matching the filters",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Todo" },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
      post: {
        summary: "Create a todo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTodo" },
            },
          },
        },
        responses: {
          "201": {
            description: "Todo created",
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
    },
    "/todos/{id}": {
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
          description: "MongoDB ObjectId of the todo.",
        },
      ],
      get: {
        summary: "Get a todo",
        responses: {
          "200": {
            description: "Todo",
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
      put: {
        summary: "Update a todo",
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
            description: "Todo updated",
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
        summary: "Delete a todo",
        responses: {
          "204": { description: "Todo deleted" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    schemas: {
      Message: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
          documentation: {
            type: "string",
            description: "Path to the Swagger UI documentation.",
            example: "/api-docs",
          },
        },
      },
      Todo: {
        type: "object",
        required: ["id", "title", "completed", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
          title: { type: "string" },
          completed: { type: "boolean" },
          projectId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTodo: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1 },
          projectId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
      UpdateTodo: {
        type: "object",
        required: ["title"],
        additionalProperties: false,
        properties: {
          title: { type: "string", minLength: 1 },
          completed: { type: "boolean" },
        },
      },
      Error: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
          stack: { type: "string" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
} as const;

export default openApiSpec;
