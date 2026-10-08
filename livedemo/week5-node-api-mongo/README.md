# Express API Starter with Typescript

A JavaScript Express v5 starter template with sensible defaults.

How to use this template:

```sh
pnpm dlx create-express-api@latest --typescript --directory my-api-name
```

## Initialize an Express + MongoDB REST API

To start a small Node.js REST API from scratch with JavaScript ES modules,
Express, and MongoDB, create a project and install its runtime and development
dependencies:

```sh
mkdir express-mongo-api
cd express-mongo-api
npm init -y
npm install express mongoose dotenv
npm install --save-dev nodemon
npm pkg set type=module
npm pkg set "scripts.dev=nodemon src/index.js"
npm pkg set "scripts.start=node src/index.js"
mkdir -p src/models src/routes src/controllers
touch .gitignore
```

Create a `.env` file in the project root and set a local MongoDB URI or your
MongoDB Atlas connection string:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/my_app
PORT=3000
```

Add `.env` to `.gitignore` so database credentials are not committed. In
`.gitignore`, include both `.env` and `node_modules/`. Start MongoDB locally
or make sure your Atlas cluster is reachable. Then create `src/index.js`:

```js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

const { MONGODB_URI, PORT = "3000" } = process.env;
if (!MONGODB_URI) throw new Error("MONGODB_URI is required");

await mongoose.connect(MONGODB_URI);
app.listen(Number(PORT), () => {
  console.log("API listening on port " + PORT);
});
```

This connects to MongoDB with `mongoose.connect()` **before** calling
`app.listen()`, so the API does not accept requests before its database is
ready. Start it with `npm run dev`, then request
`GET http://localhost:3000/api/v1/health` to confirm it is running.

Organize the API as it grows:

- `src/index.js` starts the database connection and HTTP listener.
- `src/app.js` configures Express middleware and mounts route modules.
- `src/routes/` maps versioned paths such as `/api/v1/items` to handlers.
- `src/controllers/` validates input, calls the data layer, and sends HTTP responses.
- `src/models/` defines Mongoose schemas and MongoDB persistence.

For a resource such as `items`, build the REST operations incrementally:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/items` | List records |
| `POST` | `/api/v1/items` | Create a record |
| `GET` | `/api/v1/items/:id` | Get one record |
| `PATCH` | `/api/v1/items/:id` | Update a record |
| `DELETE` | `/api/v1/items/:id` | Delete a record |

Validate request bodies and route IDs, return appropriate status codes (for
example, `400` for invalid input and `404` when a record is missing), and add
a final error-handling middleware. Run the service with `npm run dev`; test
both normal requests and failure cases before adding more resources.

Includes API Server utilities:

- [morgan](https://www.npmjs.com/package/morgan)
  - HTTP request logger middleware for node.js
- [helmet](https://www.npmjs.com/package/helmet)
  - Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help!
- [cors](https://www.npmjs.com/package/cors)
  - CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.

Development utilities:

- [typescript](https://www.npmjs.com/package/typescript)
  - TypeScript is a language for application-scale JavaScript.
- [tsx](https://www.npmjs.com/package/tsx)
  - The easiest way to run TypeScript in Node.js
- [eslint](https://www.npmjs.com/package/eslint)
  - ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
- [vitest](https://www.npmjs.com/package/vitest)
  - Next generation testing framework powered by Vite.
- [zod](https://www.npmjs.com/package/zod)
  - Validated TypeSafe env with zod schema
- [supertest](https://www.npmjs.com/package/supertest)
  - HTTP assertions made easy via superagent.

## Setup

```
pnpm install
```

Set `MONGODB_URI` in `.env` to your MongoDB connection string. The default is
`mongodb://127.0.0.1:27017/week5-node-api-mongo`; start a local MongoDB server
before running the API. The HTTP server starts only after MongoDB connects.

## Todo REST API

Todos are stored in MongoDB and are available under `/api/v1/todos`:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/todos` | List todos, newest first |
| `POST` | `/api/v1/todos` | Create a todo |
| `GET` | `/api/v1/todos/:id` | Get a todo |
| `PUT` | `/api/v1/todos/:id` | Replace a todo |
| `PATCH` | `/api/v1/todos/:id` | Update todo fields |
| `DELETE` | `/api/v1/todos/:id` | Delete a todo |

Send JSON todo data with a required `title` and optional `description` and
`completed` fields. For example:

```json
{
  "title": "Learn Express",
  "description": "Build the todo API",
  "completed": false
}
```

Todo IDs are MongoDB ObjectIds. Invalid request data or IDs return `400`,
missing todos return `404`, and a successful delete returns `204`. Browse the
full request and response schemas in Swagger UI at `/api-docs`.

The API follows a simple MVC structure: `src/routes/` registers endpoints,
`src/controllers/` handles request validation and actions, and `src/models/`
defines MongoDB persistence.

## Project REST API

Projects are stored in MongoDB and available under `/api/v1/projects`:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/projects` | List projects, newest first; optionally filter by name |
| `POST` | `/api/v1/projects` | Create a project |
| `GET` | `/api/v1/projects/:id` | Get a project |
| `PUT` | `/api/v1/projects/:id` | Replace a project |
| `PATCH` | `/api/v1/projects/:id` | Update project fields |
| `DELETE` | `/api/v1/projects/:id` | Delete a project |

Send a JSON object with a required `name` and optional `description`:

```json
{
  "name": "Express Learning API",
  "description": "Practice REST APIs with MongoDB"
}
```

Project IDs are MongoDB ObjectIds. Invalid request data or IDs return `400`,
missing projects return `404`, and a successful delete returns `204`.
Project routes, controllers, and Mongoose persistence are separated into
`src/routes/projects.ts`, `src/controllers/projects.ts`, and
`src/models/project.ts`.

Project names in create, replace, and patch request bodies must contain at
least one letter. This is an example of custom HTTP input validation using
Zod's `.refine()` in `src/schemas/project.ts`. To add a different rule, change
the refinement callback and its error message; invalid input returns `400`
with the validation issue.

Project names must also be unique (case-sensitive). The API checks for an
existing name and returns `409` if one is already in use; a MongoDB unique
index enforces the same rule if concurrent requests try to save duplicate
names. If a database already contains duplicate project names, those records
must be resolved before MongoDB can build the unique index.

Filter the project list by an exact name with the `name` query parameter:
`GET /api/v1/projects?name=Express%20Learning%20API`. Query names are trimmed
and must contain between 1 and 200 characters; invalid or unsupported query
parameters return `400`.

## Lint

```
pnpm run lint
```

## Test

```
pnpm run test
```

## Development

```
pnpm run dev
```

## Learning Homepage

Open [http://localhost:3000](http://localhost:3000) while the server is running
for an overview of the project, its request flow, API endpoints, and local setup.

## API Documentation

With the API running, open [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
to browse the Swagger UI. The OpenAPI document is also available at
`/api-docs/openapi.json`. The UI bundle is loaded from unpkg, so the browser
needs internet access to display the interactive interface.
