# Todo REST API — a Node.js learning project (Connect middleware)

Same tiny Todo REST API as the sister project [`../todo-node-api`](../todo-node-api),
but built on top of **[Connect](https://github.com/senchalabs/connect)** — a
minimalist middleware framework and the ancestor of Express.

Read the two projects side-by-side to see what a middleware framework actually
adds to raw Node.js:

| Concern              | `todo-node-api` (raw `http`)                        | `todo-connect-api` (Connect)                          |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Request entry point  | one big `http.createServer((req, res) => ...)`      | a chain of `app.use(mw)` calls                        |
| CORS                 | called inline from the top-level callback           | `src/middleware/cors.js` — a `(req, res, next)` fn    |
| JSON body parsing    | controllers call `await readRequestBody(req)`       | `src/middleware/body.js` populates `req.body` for you |
| Unknown route        | fallthrough at the bottom of the router             | dedicated `notFound` middleware at the tail           |
| Uncaught error       | top-level `try/catch` in the request callback       | `errorHandler` middleware (4-arg signature)           |

Everything else — the models, controllers, response helpers, validation, the
JSON-file "database", the tests — is identical. That's on purpose: it isolates
the *framework* change from the *behaviour*, which is what makes the two
projects useful to compare.

---

## Table of contents

1. [What is Connect?](#what-is-connect)
2. [Middleware chain in this app](#middleware-chain-in-this-app)
   - [Interactive API docs (Swagger UI)](#interactive-api-docs-swagger-ui)
3. [Running the project](#running-the-project)
4. [API documentation](#api-documentation)
5. [Testing](#testing)
6. [Project structure](#project-structure)
7. [Connect vs raw `http` vs Express](#connect-vs-raw-http-vs-express)

---

## What is Connect?

Connect is a ~200-line framework whose entire job is to compose *middleware
functions*. A middleware is a function of the form:

```js
function (req, res, next) {
    // do something with req/res,
    // then EITHER respond (res.end / res.writeHead)
    // OR call next() to hand off to the next middleware
    // OR call next(err) to jump to the error handler
}
```

You register middleware with `app.use(mw)`. Connect calls them in the order
they were registered:

```js
const connect = require("connect");
const app = connect();

app.use((req, res, next) => { console.log(req.method, req.url); next(); });
app.use((req, res)       => { res.end("hello"); });

require("http").createServer(app).listen(3001);
```

Two things worth noticing:

* Connect does **not** ship a router. Express adds one on top; here we write
  our own in `src/router.js` so you can see exactly what a router is (spoiler:
  it's just another middleware).
* Connect does **not** decorate `res` the way Express does. There is no
  `res.json()`, no `res.status()`. You use the raw Node `res.writeHead()` /
  `res.end()` — the same primitives as in the sister project. Our
  `src/utils/response.js` helpers wrap them.

---

## Middleware chain in this app

```
request
   |
   v
[ cors        ]   set Access-Control-* headers (+ answer OPTIONS 204)
   |
   v
[ swagger     ]   mounted at /api-docs -- Swagger UI + OpenAPI spec
   |
   v
[ body        ]   parse JSON request body into req.body
   |
   v
[ router      ]   match method+URL, call the right controller
   |
   v
[ notFound    ]   nothing above handled it -> 404 JSON
   |
   v
[ errorHandler]   any next(err) upstream -> 500 JSON
```

All the middleware files live in `src/middleware/` (plus `src/router.js`,
which is a middleware by convention rather than nesting depth). Follow the
imports from `src/app.js` to see how they are wired together.

### Interactive API docs (Swagger UI)

The API is documented with an OpenAPI 3.0 spec in `src/openapi.js`. Two
endpoints expose it:

| Path                     | What it serves                                     |
| ------------------------ | -------------------------------------------------- |
| `/api-docs/`             | Swagger UI — browsable, "try it out" docs page     |
| `/api-docs/swagger.json` | The raw OpenAPI 3.0 spec as JSON                   |

Both are served by `src/middleware/swagger.js`, which combines
[`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) (the
static Swagger UI web app) with [`serve-static`](https://www.npmjs.com/package/serve-static)
(a Connect-compatible static file middleware). We deliberately do **not**
use `swagger-ui-express` — it hard-depends on Express's `res.send()` and
would defeat the point of this project.

If you add a route to `src/router.js`, add its schema to `src/openapi.js`
too — the Swagger UI page is only as accurate as that file.

---

## Running the project

```bash
# install the ONE dependency (connect)
npm install

# start the server on http://localhost:3001
npm start

# or with auto-reload on file changes
npm run dev
```

Then open one of:

* **http://localhost:3001/** — the browsable home page.
* **http://localhost:3001/api-docs/** — the Swagger UI, where you can call
  every endpoint from the browser.

Or hit the API directly:

```bash
curl http://localhost:3001/api/todos
curl -X POST http://localhost:3001/api/todos \
     -H "Content-Type: application/json" \
     -d '{"title":"Learn Connect"}'
```

The server defaults to port **3001** so it can run at the same time as the
sister `todo-node-api` project (which uses 3000).

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

Every error response has the shape `{ "error": "message" }`. Standard status
codes: 200/201/204 for success, 400 for validation errors, 404 for missing
resources, 405 for a bad method on a known URL, 500 for unexpected server
errors.

---

## Testing

```bash
npm test
```

This runs `node --test test/` — the built-in Node test runner. No Jest, no
Mocha. Tests start the server on a random free port and use the global
`fetch()` (built into Node ≥ 18) to make real HTTP requests. See
`test/server.test.js` for the whole thing.

### Code coverage

Node 20+ ships a coverage collector as a flag on the built-in test runner —
no `nyc`, `c8`, or `jest --coverage` needed. Two scripts:

```bash
# 1. Terminal-only summary — a per-file table with line / branch / function
#    percentages and the uncovered line numbers.
npm run test:coverage

# 2. Terminal summary PLUS a machine-readable coverage/lcov.info file.
#    Point CI at the LCOV file, or install the "Coverage Gutters" VS Code
#    extension and it will highlight covered / uncovered lines in red/green
#    right in your editor.
npm run test:coverage:lcov
```

Under the hood these run:

```bash
node --test \
     --experimental-test-coverage \
     --test-coverage-exclude='test/**' \
     [--test-reporter=spec --test-reporter-destination=stdout \
      --test-reporter=lcov --test-reporter-destination=coverage/lcov.info] \
     test/
```

`--test-coverage-exclude` keeps the tests themselves out of the report —
otherwise you get a misleading 100% on `test/server.test.js`. The `coverage/`
directory is `.gitignore`d.

Sample output:

```
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ src             |        |          |         |
ℹ  app.js         | 100.00 |   100.00 |  100.00 |
ℹ  controllers    |        |          |         |
ℹ   home.js       |  87.18 |    66.67 |  100.00 | 32-36
ℹ   todos.js      |  97.20 |    80.00 |  100.00 | 108-109 114-115
ℹ ...
ℹ all files       |  96.67 |    82.65 |   96.15 |
```

The uncovered-lines column tells you what your tests are missing at a glance —
in this project those are mostly error-recovery branches (a file that never
throws in tests, a request that never disconnects mid-body).

---

## Project structure

```
todo-connect-api/
├── data/
│   └── todos.json           the JSON "database"
├── src/
│   ├── app.js               builds the Connect app + http.Server
│   ├── router.js            router middleware (method + URL -> controller)
│   ├── openapi.js           OpenAPI 3.0 spec (Swagger UI reads this)
│   ├── controllers/
│   │   ├── home.js          GET /  (serves the HTML page)
│   │   └── todos.js         all /api/todos handlers
│   ├── middleware/
│   │   ├── cors.js          CORS headers + preflight
│   │   ├── swagger.js       Swagger UI + spec, mounted at /api-docs
│   │   ├── body.js          JSON body parser (populates req.body)
│   │   └── errors.js        notFound + errorHandler
│   ├── models/
│   │   └── todos.js         readTodos / writeTodos (JSON file I/O)
│   ├── utils/
│   │   ├── response.js      sendJson / sendError / sendHtml helpers
│   │   └── validation.js    parseTodoId
│   └── views/
│       └── home.html        landing page
├── test/
│   └── server.test.js       integration tests (node:test + fetch)
├── package.json
├── server.js                entry point (just starts src/app.js listening)
└── README.md
```

---

## Connect vs raw `http` vs Express

Think of these three as a progression:

* **Raw `http`** (the sister project) — you have `req`, `res`, and nothing
  else. You write your own routing, your own body parsing, your own error
  handling. Great for learning. Painful past a certain size.
* **Connect** (this project) — Connect gives you *one* thing: a way to compose
  middleware. No routing, no `res.json()`, no template engine. You still write
  your own router, but each concern lives in its own function.
* **Express** — Connect + a full router (`app.get("/api/todos/:id", ...)`) +
  helpers on `res` (`res.status(200).json(...)`) + a big ecosystem of
  middleware (`cors`, `express.json`, `morgan`, ...).

So Express is not doing anything magical — every convenience it adds could
be, and often was, written as a Connect middleware first.
