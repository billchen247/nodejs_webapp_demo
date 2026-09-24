# Todo REST API — a Node.js learning project (no Express)

A tiny, complete Todo REST API built with **only Node.js built-in modules**.
No Express. No Fastify. No routing library. No database. No third-party
runtime dependencies at all.

This project exists so students can **read a finished, working codebase**
and understand exactly what an HTTP server does before learning Express.
Every non-trivial file has header comments explaining what it is and why
it exists; this README fills in the big-picture explanations that don't
fit inside the code.

Open [`http://localhost:3000/`](http://localhost:3000/) after starting the
server for a browsable landing page that lists the endpoints and shows
live data pulled from the API.

---

## Table of contents

1. [What are we building?](#what-are-we-building)
2. [Why are we NOT using Express?](#why-are-we-not-using-express)
3. [What is Node.js?](#what-is-nodejs)
4. [What is an HTTP server?](#what-is-an-http-server)
5. [What is a REST API?](#what-is-a-rest-api)
6. [How does this server work?](#how-does-this-server-work)
7. [Important Node.js concepts](#important-nodejs-concepts)
8. [Running the project](#running-the-project)
9. [API documentation](#api-documentation)
10. [Testing](#testing)
11. [Node.js vs Express — side by side](#nodejs-vs-express--side-by-side)
12. [Project structure](#project-structure)

---

## What are we building?

A small REST API that stores a list of "todos" — the classic learning
example. Each todo looks like:

```json
{
  "id": 1,
  "title": "Learn Node.js",
  "completed": false,
  "createdAt": "2026-09-23T12:00:00.000Z"
}
```

The API supports the five standard CRUD operations:

| Method   | Path                | What it does                    |
|----------|---------------------|---------------------------------|
| `GET`    | `/api/todos`        | list all todos                  |
| `GET`    | `/api/todos/:id`    | fetch one todo by id            |
| `POST`   | `/api/todos`        | create a new todo               |
| `PUT`    | `/api/todos/:id`    | update an existing todo         |
| `DELETE` | `/api/todos/:id`    | delete a todo                   |

Data is stored in `data/todos.json` — a plain text file you can open in
any editor. No database, no schema, no migrations.

---

## Why are we NOT using Express?

Express is fantastic. Most production Node.js APIs use it. But Express is a
**layer on top of Node.js's built-in `http` module** — it does not add
capabilities to your machine, it just makes the raw APIs easier to use.

If we jump straight to Express, students get comfortable with helpers like
`app.get("/api/todos/:id", ...)` without ever knowing what those helpers
are hiding. That leads to confusion the first time something goes wrong:

- "Where does `req.body` come from?"
- "Why is `req.params.id` a string, not a number?"
- "What is CORS actually doing?"
- "Why does the response hang forever?"

This project answers those questions by writing the parts Express usually
hides — routing, body parsing, JSON handling, status codes, CORS — by hand.
After reading `server.js`, Express feels much more like a friendly wrapper
and much less like magic.

---

## What is Node.js?

Node.js is a **JavaScript runtime**. Historically, JavaScript ran only
inside the browser. Node.js took Google's V8 JavaScript engine (from Chrome)
out of the browser and gave it a set of "system" APIs the browser doesn't
have — filesystem access, TCP sockets, HTTP servers, processes, streams,
timers, and so on.

Every module we use in this project (`http`, `fs/promises`, `path`, `URL`)
ships with Node.js. Running the app requires nothing more than:

```bash
node server.js
```

---

## What is an HTTP server?

An **HTTP server** is a program that:

1. Listens on a TCP port (here, port 3000).
2. Accepts incoming HTTP requests from clients (browsers, `curl`, `fetch`).
3. Reads the request's method, URL, headers, and (optionally) body.
4. Decides what to do based on that information.
5. Sends back an HTTP response: a status code, some headers, and (optionally)
   a body.

Visually:

```
Client                                     Server
  |                                          |
  |   HTTP request                           |
  |   GET /api/todos                         |
  | ---------------------------------------> |
  |                                          |
  |                                          | (do something,
  |                                          |  maybe read data/todos.json)
  |                                          |
  |   HTTP response                          |
  |   200 OK                                 |
  |   Content-Type: application/json         |
  |   [{"id":1,"title":"Learn Node.js"}]     |
  | <--------------------------------------- |
  |                                          |
```

In Node.js, you build one with:

```js
const http = require("http");
const server = http.createServer((req, res) => {
    // Called ONCE per incoming request.
    // Look at req.method, req.url, req.headers.
    // Write your response by setting res.writeHead(status, headers)
    // and calling res.end(body).
});
server.listen(3000);
```

That callback is where **every** request in this project ends up. From
there, `server.js` decides which route handler to run.

---

## What is a REST API?

REST is a convention for designing web APIs around **resources**. A
resource is a "thing" the API knows about — here, a todo. Each resource
has a URL:

```
/api/todos      -> the collection of todos
/api/todos/1    -> the todo with id 1
/api/todos/2    -> the todo with id 2
```

The **HTTP method** tells the server what you want to do with the
resource:

| Method   | Meaning                                |
|----------|----------------------------------------|
| `GET`    | read (never modifies data)             |
| `POST`   | create a new resource                  |
| `PUT`    | replace / update an existing resource  |
| `DELETE` | remove a resource                      |

The server responds with a **status code** to describe what happened:

| Code   | Meaning                                                  |
|--------|----------------------------------------------------------|
| `200`  | OK — request succeeded, body contains the result         |
| `201`  | Created — a new resource was made                        |
| `204`  | No Content — success, but no body (used by DELETE)       |
| `400`  | Bad Request — the client sent malformed data             |
| `404`  | Not Found — no such resource                             |
| `405`  | Method Not Allowed — right URL, wrong verb               |
| `500`  | Internal Server Error — the server itself broke          |

Bodies are exchanged as **JSON** because it maps directly to JavaScript
values and is easy to inspect in a browser's DevTools.

---

## How does this server work?

Here's the entire request lifecycle across the `src/` folders:

```
                     1. server.js
                     server.listen(3000)
                              |
              incoming request lands
                              |
                              v
        src/app.js  --  http.createServer((req, res) => ...)
                              |
                              v
        src/middleware/cors.js  --  setCorsHeaders(res)
                              |
                              v
             was this an OPTIONS preflight?
                       yes -> reply 204, done
                        no |
                           v
              src/router.js  --  route(req, res)
                           |
      parse req.url with the standard URL API
      split pathname into segments (["api","todos", ...])
      match segments + req.method against known routes
                           |
     +---------------------+-------------------------+
     |                     |                         |
     v                     v                         v
src/controllers/    src/controllers/todos.js   405 Method Not Allowed
home.js             listTodos / getTodoById /  or 404 Route not found
(GET /)             createTodo / updateTodo /
                    deleteTodo
                              |
             +----------------+----------------+
             |                                 |
             v                                 v
   src/middleware/body.js               src/models/todos.js
   readRequestBody(req)                 readTodos() / writeTodos()
   (POST / PUT only)                    (fs/promises + JSON)
                              |
                              v
        src/utils/response.js  --  sendJson / sendHtml / sendError
                              |
                              v
   res.writeHead(status, headers)
   res.end(body)
                              |
                              v
                          client
```

Any exception thrown along the way is caught by the top-level `try/catch`
in `src/app.js`, which turns it into a **500 Internal Server Error**
with a generic message — never a stack trace to the client.

---

## Important Node.js concepts

The code and comments in `server.js` cover these in depth. Here's a short
glossary you can keep next to it:

- **Modules & `require`.** Node.js splits code into files, each of which is
  a module. `require("http")` loads a built-in; `require("./server")` loads
  a file relative to the current one. What a module exports becomes
  available via `module.exports`.
- **`http` module.** Built-in HTTP client and server. We use
  `http.createServer(callback)` to build the server.
- **`req` (`http.IncomingMessage`).** Information about the incoming
  request: `req.method`, `req.url`, `req.headers`, and also a **readable
  stream** for the request body.
- **`res` (`http.ServerResponse`).** How you build the response:
  `res.writeHead(statusCode, headers)` and `res.end(body)`. Every request
  MUST get exactly one response, or the client hangs.
- **Streams and events.** Node uses an event-driven model. A request body
  arrives as `"data"` events (each carrying a chunk) followed by one
  `"end"` event when the client has finished sending.
- **Promises.** A `Promise` represents a value that isn't ready yet —
  either it will fulfill (resolve) with a value or reject with an error.
- **`async`/`await`.** Sugar on top of Promises. `await promise` pauses
  the surrounding `async` function until the Promise settles, without
  blocking the event loop.
- **Filesystem (`fs/promises`).** `fs.readFile(path, "utf8")` returns
  a `Promise<string>`; `fs.writeFile(path, contents, "utf8")` returns
  a `Promise<void>`.
- **`JSON.parse` vs `JSON.stringify`.**
  - `JSON.parse(text)` — JSON string → JavaScript value.
  - `JSON.stringify(value)` — JavaScript value → JSON string.

---

## Running the project

You need **Node.js 20 or newer** (this project uses the global `fetch()`
which is stable from Node 20 onward). Check yours with `node --version`.

```bash
cd todo-node-api
npm install    # nothing to install, but this creates package-lock.json
npm start
```

You should see:

```
Todo API listening on http://localhost:3000
```

Try it out:

```bash
# List all todos
curl http://localhost:3000/api/todos

# Get one todo
curl http://localhost:3000/api/todos/1

# Create a todo
curl -X POST http://localhost:3000/api/todos \
     -H "Content-Type: application/json" \
     -d '{"title":"Try the API"}'

# Update it
curl -X PUT http://localhost:3000/api/todos/1 \
     -H "Content-Type: application/json" \
     -d '{"completed":true}'

# Delete it
curl -X DELETE http://localhost:3000/api/todos/1 -i
```

The data lives in `data/todos.json`. Feel free to open it and see how the
API's mutations change the file.

---

## API documentation

### `GET /`

The landing page. Returns an HTML document (`Content-Type: text/html`) that
lists every endpoint and, via a small piece of client-side JavaScript,
fetches `/api/todos` and renders the current todos. Handled by
`src/controllers/home.js`, template lives at `src/views/home.html`.

`405 Method Not Allowed` for anything other than `GET`.

### `GET /api/todos`

Return every todo.

Optional query parameter:

- `completed=true` — only completed todos
- `completed=false` — only incomplete todos

Response `200 OK`:

```json
[
  {
    "id": 1,
    "title": "Learn Node.js",
    "completed": false,
    "createdAt": "2026-09-23T12:00:00.000Z"
  }
]
```

### `GET /api/todos/:id`

Return one todo.

- `200 OK` — found (body is the todo)
- `400 Bad Request` — `id` is not a positive integer
- `404 Not Found` — no todo has that id

### `POST /api/todos`

Create a todo.

Request body:

```json
{ "title": "Learn Node.js" }
```

Response `201 Created`:

```json
{
  "id": 4,
  "title": "Learn Node.js",
  "completed": false,
  "createdAt": "2026-09-23T13:00:00.000Z"
}
```

- `400 Bad Request` — missing/empty `title`, or invalid JSON body

### `PUT /api/todos/:id`

Update a todo. Both fields are optional; missing fields are left unchanged.

```json
{ "title": "New title", "completed": true }
```

- `200 OK` — updated (body is the updated todo)
- `400 Bad Request` — invalid id, invalid JSON, or invalid field type
- `404 Not Found` — no todo has that id

### `DELETE /api/todos/:id`

Delete a todo.

- `204 No Content` — deleted (empty body)
- `400 Bad Request` — invalid id
- `404 Not Found` — no todo has that id

### Errors

Every error response has the same shape:

```json
{ "error": "Human-readable message" }
```

### CORS

Every response includes:

```
Access-Control-Allow-Origin:  http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type
```

`OPTIONS` requests are answered with `204 No Content` (the CORS preflight
response) so browsers running your future React app on port 5173 can call
the API without being blocked.

---

## Testing

Tests use Node's **built-in test runner** and its **built-in `fetch()`**.
There are no third-party test libraries. Run:

```bash
npm test
```

The tests boot the server on a random free port, make real HTTP calls,
and reset `data/todos.json` between tests so they don't interfere with
each other. See [`test/server.test.js`](test/server.test.js) for the
full list — each test starts with a comment saying what it demonstrates.

Coverage:

- `GET /api/todos` — full list, plus `?completed=true` / `?completed=false`
- `GET /api/todos/:id` — 200, 400 (bad id), 404 (missing)
- `POST /api/todos` — 201, 400 (no title), 400 (invalid JSON)
- `PUT /api/todos/:id` — 200, 404 (missing)
- `DELETE /api/todos/:id` — 204, 404 (missing)
- Unknown routes — 404
- CORS preflight — 204 with the right headers

---

## Node.js vs Express — side by side

Look at how much boilerplate Express removes. In this project the routing
looks like this:

```js
// src/router.js (Node.js only)
const segments = pathname.split("/").filter(Boolean);
if (segments.length === 2 && segments[0] === "api" && segments[1] === "todos") {
    if (method === "GET")  return todosController.listTodos(res, url);
    if (method === "POST") return todosController.createTodo(req, res);
}
if (segments.length === 3 && segments[0] === "api" && segments[1] === "todos") {
    const idString = segments[2];
    if (method === "GET")    return todosController.getTodoById(res, idString);
    if (method === "PUT")    return todosController.updateTodo(req, res, idString);
    if (method === "DELETE") return todosController.deleteTodo(res, idString);
}
```

The Express equivalent is:

```js
// with Express
app.get("/api/todos", handleGetAllTodos);
app.post("/api/todos", handleCreateTodo);
app.get("/api/todos/:id", handleGetTodoById);
app.put("/api/todos/:id", handleUpdateTodo);
app.delete("/api/todos/:id", handleDeleteTodo);
```

Body parsing:

```js
// src/middleware/body.js (Node.js only)
const chunks = [];
req.on("data", (chunk) => chunks.push(chunk));
req.on("end", () => {
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(raw);
    // ... now use `body`
});
```

Express:

```js
app.use(express.json());
// ... then just use req.body
```

Sending JSON:

```js
// src/utils/response.js (Node.js only)
res.writeHead(200, { "Content-Type": "application/json" });
res.end(JSON.stringify(payload));
```

Express:

```js
res.status(200).json(payload);
```

CORS:

```js
// src/middleware/cors.js (Node.js only)
res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
```

Express + `cors` npm package:

```js
app.use(cors({ origin: "http://localhost:5173" }));
```

None of this is magic. Express is just doing what our `src/` folder does —
it has to; there is no other way. Now that you can see both, moving to
Express is just a matter of learning the shorthand.

---

## Project structure

The project follows a conventional REST-API layout — an entry point that
only starts the server, and a `src/` folder split into
`controllers/models/middleware/utils/views`. Each folder is deliberately
small; the goal is a shape that scales, not enterprise ceremony.

```
todo-node-api/
├── package.json                 npm scripts and metadata (no runtime deps)
├── README.md                    this file
├── server.js                    ENTRY POINT — just starts the server
├── data/
│   └── todos.json               the "database" — plain JSON on disk
├── src/
│   ├── app.js                   creates http.Server, wires middleware + router
│   ├── router.js                matches method + pathname to a controller
│   ├── controllers/
│   │   ├── home.js              GET / — serves the landing page
│   │   └── todos.js             the 5 CRUD handlers for /api/todos
│   ├── models/
│   │   └── todos.js             readTodos / writeTodos (JSON-file store)
│   ├── middleware/
│   │   ├── cors.js              CORS headers (setCorsHeaders)
│   │   └── body.js              readRequestBody — the stream -> JSON step
│   ├── utils/
│   │   ├── response.js          sendJson / sendError / sendHtml
│   │   └── validation.js        parseTodoId
│   └── views/
│       └── home.html            the landing page HTML
└── test/
    └── server.test.js           tests, using node:test + built-in fetch()
```

If you're new to the codebase, read in this order: `server.js` →
`src/app.js` → `src/router.js` → the controllers you're curious about,
then the models/middleware/utils they call into.

Happy hacking! When you're ready to graduate to Express, you'll find every
concept in this project has a one-line Express equivalent — and you'll
know exactly what that one line is doing under the hood.
