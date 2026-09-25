# Todo REST API — a Node.js learning project (Express 5 + TypeScript)

The third project in the series. Same tiny Todo REST API as
[`../todo-node-api`](../todo-node-api) (raw `http`) and
[`../todo-connect-api`](../todo-connect-api) (Connect), but built with the
modern Node.js REST stack:

- **[Express 5](https://expressjs.com/2024/10/15/v5-release.html)** — the
  latest stable major (2024). Async errors now propagate to the error
  middleware automatically; no `express-async-errors` needed.
- **TypeScript 5** with strict flags (`noUncheckedIndexedAccess`,
  `noImplicitReturns`, `noUnusedLocals`, ...).
- **ESM** (`"type": "module"`, `import`/`export`, `.js` extensions on
  relative imports even in `.ts` files).
- **[Zod](https://zod.dev)** for request validation — schemas double as
  TypeScript types via `z.infer`.
- **[Helmet](https://helmetjs.github.io/)** for hardening HTTP headers,
  **[cors](https://www.npmjs.com/package/cors)**,
  **[morgan](https://www.npmjs.com/package/morgan)** for request logging,
  **[express-rate-limit](https://www.npmjs.com/package/express-rate-limit)**,
  **[compression](https://www.npmjs.com/package/compression)** for gzip.
- **[swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)**
  for interactive API docs.
- **[Vitest](https://vitest.dev/)** + **[supertest](https://www.npmjs.com/package/supertest)**
  for tests.
- **[tsx](https://tsx.is/)** for zero-config dev runs (`tsx watch`).

---

## Table of contents

1. [How this compares to the sister projects](#how-this-compares-to-the-sister-projects)
2. [Middleware chain in this app](#middleware-chain-in-this-app)
3. [Running the project](#running-the-project)
4. [API documentation](#api-documentation)
5. [Testing](#testing)
6. [Project structure](#project-structure)
7. [Why these choices?](#why-these-choices)

---

## How this compares to the sister projects

The three projects deliberately implement the **same** API so the only
variable is the stack:

| Concern              | `todo-node-api` (raw `http`)                        | `todo-connect-api` (Connect)                          | `todo-node-api-express` (this)                       |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Language             | JavaScript (CommonJS)                               | JavaScript (CommonJS)                                 | **TypeScript (ESM)**                                 |
| Request entry point  | one big `http.createServer((req, res) => ...)`      | a chain of `app.use(mw)` calls                        | `express()` + `app.use(...)` + `router.route(...)`   |
| Routing              | hand-written `if (segments[0] === "api" && ...)`    | hand-written middleware doing the same thing          | **`router.route("/:id").get(...).put(...)`**         |
| Body parsing         | controllers call `await readRequestBody(req)`       | `src/middleware/body.js` populates `req.body`         | **`express.json()`** built-in middleware             |
| CORS                 | called inline from the top-level callback           | a `(req, res, next)` middleware                       | **`cors()`** package (handles preflight for you)     |
| Validation           | manual `typeof body.title === "string"` checks      | manual `typeof body.title === "string"` checks        | **Zod schemas** in `src/schemas/` + validate mw      |
| Async errors         | top-level `try/catch` in the request callback       | `next(err)` inside a `try/catch`                      | **automatic** (Express 5 forwards to error handler)  |
| Unknown route        | fallthrough at the bottom of the router             | dedicated `notFound` middleware                       | dedicated `notFoundHandler`                          |
| Security headers     | none                                                | none                                                  | **Helmet** (~15 hardening headers)                   |
| Rate limiting        | none                                                | none                                                  | **express-rate-limit**                               |
| Response compression | none                                                | none                                                  | **compression** (gzip/deflate)                       |
| Request logs         | none                                                | none                                                  | **morgan** (`dev` format)                            |
| Tests                | `node:test` + global `fetch()`                      | `node:test` + global `fetch()`                        | **Vitest + supertest**                               |
| Type-checked?        | no                                                  | no                                                    | **yes** (strict `tsc`)                               |

Read the three side-by-side. The interesting question isn't "which is
best?" — it's "**what does each layer buy you, and what does it cost?**"
Raw `http` is the smallest surface. Connect adds composition. Express adds
composition + a router + `res.status().json()` + an ecosystem. TypeScript
adds compile-time safety at the cost of a build step.

---

## Middleware chain in this app

```
request
   |
   v
[ helmet         ]   set ~15 hardening HTTP headers (CSP/HSTS/XFO/...)
   |
   v
[ cors           ]   set Access-Control-* headers (+ answer OPTIONS 204)
   |
   v
[ rate-limit     ]   300 req/min per IP (skipped under NODE_ENV=test)
   |
   v
[ compression    ]   gzip/deflate response bodies
   |
   v
[ morgan         ]   log a colourised line per request (skipped in tests)
   |
   v
[ express.json() ]   parse JSON request body into req.body
   |
   v
[ / router       ]   GET /            -> home page
[ /api-docs      ]   Swagger UI + raw OpenAPI spec
[ /api/todos     ]   the resource router (see src/routes/todos.ts)
   |
   v
[ notFoundHandler ]   nothing above handled it -> JSON 404
   |
   v
[ errorHandler    ]   any throw / next(err) -> JSON 400/404/500
```

The router itself contains its own tiny middleware chain per route — the
Zod `validate({...})` middleware runs before each controller so handlers
receive already-typed input:

```ts
todosRouter
    .route("/:id")
    .get(validate({ params: TodoIdParamSchema }), todos.getTodoById)
    .put(validate({ params: TodoIdParamSchema, body: UpdateTodoSchema }), todos.updateTodo)
    .delete(validate({ params: TodoIdParamSchema }), todos.deleteTodo);
```

### Interactive API docs (Swagger UI)

The API is documented with an OpenAPI 3.0 spec in `src/openapi.ts`:

| Path                     | What it serves                                     |
| ------------------------ | -------------------------------------------------- |
| `/api-docs/`             | Swagger UI — browsable, "try it out" docs page     |
| `/api-docs/swagger.json` | The raw OpenAPI 3.0 spec as JSON                   |

If you add a route to `src/routes/todos.ts`, add its schema to
`src/openapi.ts` too — the Swagger UI page is only as accurate as that
file.

---

## Running the project

```bash
# install deps
npm install

# start the server in dev mode (tsx + auto-reload on file changes)
npm run dev

# or: type-check then run the compiled JS
npm run build
npm start
```

Then open one of:

- **http://localhost:3002/** — the browsable home page.
- **http://localhost:3002/api-docs/** — the Swagger UI.

Or hit the API directly:

```bash
curl http://localhost:3002/api/todos
curl -X POST http://localhost:3002/api/todos \
     -H "Content-Type: application/json" \
     -d '{"title":"Learn Express 5"}'
```

The server defaults to port **3002** so it can run at the same time as
the two sister projects (`todo-node-api` on 3000, `todo-connect-api` on
3001).

---

## API documentation

| Method   | Path                             | Description                              |
| -------- | -------------------------------- | ---------------------------------------- |
| `GET`    | `/`                              | HTML landing page                        |
| `GET`    | `/api-docs/`                     | Swagger UI docs page                     |
| `GET`    | `/api-docs/swagger.json`         | OpenAPI 3.0 spec (JSON)                  |
| `GET`    | `/api/todos`                     | list all todos                           |
| `GET`    | `/api/todos?completed=true`      | list completed todos                     |
| `GET`    | `/api/todos?completed=false`     | list incomplete todos                    |
| `GET`    | `/api/todos/:id`                 | fetch one todo by id                     |
| `POST`   | `/api/todos`                     | create a todo — body `{ "title": "..." }`|
| `PUT`    | `/api/todos/:id`                 | update fields (title and/or completed)   |
| `DELETE` | `/api/todos/:id`                 | delete a todo                            |
| `GET`    | `/api/students`                  | list all students                        |
| `GET`    | `/api/students?registrationActive=true` | filter registered students        |
| `GET`    | `/api/students/:id`               | fetch one student by id                  |
| `POST`   | `/api/students`                  | create a student — body `{ "name": "..." }` |
| `PUT`    | `/api/students/:id`               | update name or registration status       |
| `DELETE` | `/api/students/:id`               | delete a student                         |
| `GET`    | `/api/projects`                   | list all projects                        |
| `GET`    | `/api/projects/:id`               | fetch one project by id                  |
| `POST`   | `/api/projects`                   | create a project — body `{ "name": "...", "description": "..." }` |
| `PUT`    | `/api/projects/:id`               | update a project's name or description   |
| `DELETE` | `/api/projects/:id`               | delete a project                         |

Every error response has the shape `{ "error": "message" }`. Standard
status codes: 200/201/204 for success, 400 for validation errors, 404 for
missing resources, 500 for unexpected server errors.

---

## Testing

```bash
# run the whole suite
npm test

# watch mode
npm run test:watch

# with a coverage report (text + coverage/lcov.info)
npm run test:coverage

# type-check without emitting JS
npm run typecheck
```

Tests use **Vitest + supertest**. Supertest calls the Express `Application`
directly — no need to open a real TCP port — so the test suite is
noticeably faster than the sister projects' `fetch()`-based tests.

The tests seed and restore `data/todos.json` around every run, so running
the suite doesn't clobber your checked-in data.

---

## Project structure

```
todo-node-api-express/
├── data/
│   ├── todos.json           the Todo JSON "database"
│   └── students.json        the Student JSON "database"
├── views/
│   └── home.html            landing page (served by res.sendFile)
├── src/
│   ├── server.ts            entry point (listen + graceful shutdown)
│   ├── app.ts               builds the Express app + middleware chain
│   ├── config.ts            env-driven constants (PORT, ALLOWED_ORIGIN)
│   ├── openapi.ts           OpenAPI 3.0 spec (Swagger UI reads this)
│   ├── controllers/
│   │   ├── home.ts          GET /  (serves the HTML page)
│   │   ├── todos.ts         all /api/todos handlers
│   │   └── students.ts      all /api/students handlers
│   ├── routes/
│   │   ├── todos.ts         express.Router for /api/todos
│   │   └── students.ts      express.Router for /api/students
│   ├── middleware/
│   │   ├── errors.ts        notFoundHandler + errorHandler
│   │   ├── swagger.ts       Swagger UI + spec, mounted at /api-docs
│   │   └── validate.ts      turns a Zod schema into an Express middleware
│   ├── models/
│   │   ├── todos.ts         readTodos / writeTodos + Todo type
│   │   └── students.ts      readStudents / writeStudents + Student type
│   ├── schemas/
│   │   ├── todos.ts         Zod schemas for params/query/body
│   │   └── students.ts      Zod schemas for params/query/body
│   └── utils/
│       └── http-error.ts    HttpError class thrown by controllers
├── test/
│   └── server.test.ts       integration tests (Vitest + supertest)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Why these choices?

**Express 5 (Oct 2024)** — the first major since 2014. The big wins are
async-error propagation, updated dependencies, and a native `router.mergeParams`
default. It's what "modern Express" now means.

**TypeScript over plain JS** — for a REST API the ROI is high: the shape
of every request/response is a contract, and types stop the classic
"forgot to handle `undefined` body" bug at compile time. The one cost is
the `.js` import extensions in ESM (`import { x } from "./y.js"` even in
a `.ts` file) — that's just how Node's ESM resolver works.

**ESM over CommonJS** — Node has supported ESM for years; CommonJS is
now the legacy mode. Every dependency here loads cleanly under ESM.

**Zod over Joi/Yup** — Zod's schemas produce TypeScript types via
`z.infer<typeof S>`, so the validator and the type never drift. Joi has
a similar feature (`joi-to-typescript`) but it's a separate codegen step.

**Vitest + supertest over `node:test` + `fetch()`** — the sister projects
use the built-in test runner because they're teaching Node primitives.
Here we're teaching the Express stack, so we use the tooling most Express
apps do. Vitest also gives us TypeScript out of the box; running
`node --test` on `.ts` files requires additional setup.

**Helmet / cors / morgan / express-rate-limit / compression** — these are
the small, single-purpose middleware packages you'll find in almost every
production Express codebase. Adopting them here means the project doubles
as a template for a real service, not just a demo.
