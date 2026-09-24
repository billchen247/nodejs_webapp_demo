# Todo REST API — a Node.js learning project (Express)

Same tiny Todo REST API as [`../todo-connect-api`](../todo-connect-api), but
built on **[Express](https://expressjs.com/)** — the mainstream framework
that grew out of Connect. Compare the two side-by-side to see what Express
adds on top of a pure middleware framework.

| Concern              | `todo-connect-api` (Connect)                          | `todo-express-api` (Express)                           |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Router               | hand-written in `src/router.js` (~80 lines)           | `express.Router()` with `:id` path params              |
| CORS                 | `src/middleware/cors.js` — a `(req, res, next)` fn    | one call to the `cors` npm package                     |
| JSON body parsing    | `src/middleware/body.js` (~85 lines)                  | one call to `express.json()`                           |
| Response helpers     | `src/utils/response.js` — `sendJson`/`sendError`/…    | built into `res` — `res.status(n).json(x)`             |
| Home page            | manual `fs.readFile` + writeHead + cache              | one call to `res.sendFile(path)`                       |
| Swagger UI           | manual mount using `serve-static` + `swagger-ui-dist` | `swagger-ui-express` — `swaggerUi.setup(spec)`         |
| Unknown route        | dedicated `notFound` middleware at the tail           | *same* — Express reuses Connect's middleware model     |
| Uncaught error       | `errorHandler` middleware (4-arg signature)           | *same* — plus a `entity.parse.failed` → 400 shortcut   |

Everything else — the models, controllers, validation, the JSON-file
"database", the OpenAPI spec, the tests — mirrors the Connect version. That
is on purpose: it isolates the *framework* change from the *behavior*, which
is what makes the two projects worth comparing.

---

## Table of contents

1. [What Express is (compared to Connect)](#what-express-is-compared-to-connect)
2. [Middleware chain in this app](#middleware-chain-in-this-app)
3. [Running the project](#running-the-project)
4. [API documentation](#api-documentation)
5. [Testing](#testing)
6. [Project structure](#project-structure)
7. [Connect vs Express side-by-side](#connect-vs-express-side-by-side)

---

## What Express is (compared to Connect)

Express *is* Connect, plus three things Connect deliberately leaves out:

1. **A router.** `express.Router()` matches HTTP verb + path pattern and
   populates `req.params` for you. Paths like `/api/todos/:id` "just work"
   — no hand-written `pathname.split("/")` needed.
2. **Response helpers.** `res.json(x)`, `res.status(n)`, `res.sendFile(p)`,
   `res.redirect(url)`, and friends are all attached to the response object
   the first time an Express handler runs.
3. **A built-in body parser.** `express.json()` streams the request body,
   JSON-parses it, and puts the result on `req.body`.

Everything else is the *same middleware model* Connect defined — a chain of
`function(req, res, next)` handlers you register with `app.use(...)`. That
is why swapping frameworks only touched about a dozen lines in
`src/app.js` + `src/routes/todos.js`.

---

## Middleware chain in this app

```
request
   |
   v
[ cors() ]              set Access-Control-* headers (+ answer OPTIONS)
   |
   v
[ /api-docs router ]    Swagger UI + spec
   |
   v
[ express.json() ]      parse JSON body -> req.body
   |
   v
[ GET / handler ]       serve the home page HTML
   |
   v
[ /api/todos router ]   CRUD controllers (with :id path param)
   |
   v
[ notFound ]            no route matched -> 404 JSON
   |
   v
[ errorHandler ]        any next(err) upstream -> 500 (or 400 for bad JSON)
```

### Interactive API docs (Swagger UI)

`swagger-ui-express` mounts the UI at `/api-docs`. The raw OpenAPI 3.0
spec (defined inline as a plain JS object in `src/openapi.js`) is served
at `/api-docs/swagger.json`. Open [`http://localhost:3002/api-docs/`](http://localhost:3002/api-docs/)
once the server is running.

---

## Running the project

```bash
cd todo-express-api
npm install
npm run dev            # auto-reload on file changes
# or:
npm start              # plain node server.js
```

- Home page: <http://localhost:3002/>
- API root:  <http://localhost:3002/api/todos>
- Swagger UI: <http://localhost:3002/api-docs/>

Port `3002` was chosen so this project can run alongside
`../todo-node-api` (3000) and `../todo-connect-api` (3001) at the same
time.

---

## API documentation

Same shape as `../todo-connect-api`:

| Method | Path              | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| GET    | `/api/todos`      | List every todo (optional `?completed=true|false`) |
| GET    | `/api/todos/:id`  | Fetch a single todo                              |
| POST   | `/api/todos`      | Create a todo (body: `{ "title": "..." }`)       |
| PUT    | `/api/todos/:id`  | Update a todo (body: `{ title?, completed? }`)   |
| DELETE | `/api/todos/:id`  | Delete a todo                                    |

Error responses are `{ "error": "message" }` — same contract as the Connect
version, so any client written against one project also works against the
other.

---

## Testing

Uses Node's built-in `node:test` runner and the global `fetch()` — no Jest,
no Vitest, no Supertest. Deliberately identical setup to
`../todo-connect-api/test/server.test.js`, so you can diff the two test
files and see how the API contract stays the same when the framework
changes.

```bash
npm test                  # run once
npm run test:coverage     # with coverage
npm run test:coverage:lcov  # emit coverage/lcov.info for CI
```

---

## Project structure

```
todo-express-api/
├── package.json
├── server.js                 # entry point — starts the http.Server
├── data/
│   └── todos.json            # the "database"
├── src/
│   ├── app.js                # wires up middleware + routers
│   ├── openapi.js            # OpenAPI 3.0 spec (inline)
│   ├── controllers/
│   │   ├── home.js           # GET /
│   │   └── todos.js          # CRUD handlers
│   ├── middleware/
│   │   ├── errors.js         # notFound + errorHandler
│   │   └── swagger.js        # mounts swagger-ui-express
│   ├── models/
│   │   └── todos.js          # readTodos / writeTodos (fs/promises)
│   ├── routes/
│   │   └── todos.js          # express.Router() for /api/todos
│   ├── utils/
│   │   └── validation.js     # parseTodoId
│   └── views/
│       └── home.html         # landing page
└── test/
    └── server.test.js        # end-to-end tests using fetch()
```

---

## Connect vs Express side-by-side

To learn the most, run both projects and diff equivalent files:

- `src/app.js` — same shape, but the Express version drops two custom
  middlewares (body, cors) and gains one line per route group.
- `src/router.js` (Connect) → `src/routes/todos.js` (Express) — the
  hand-written pathname/segment matching disappears entirely.
- `src/utils/response.js` (Connect) → *removed* — controllers call
  `res.status(...).json(...)` directly.
- `src/middleware/body.js` (Connect) → *removed* — `express.json()`.
- `src/middleware/cors.js` (Connect) → *removed* — `cors` npm package.
- `src/middleware/swagger.js` — collapses from ~110 lines of manual
  static-file plumbing to ~25 lines that delegate to
  `swagger-ui-express`.

Same API contract, roughly one-third the framework code.
