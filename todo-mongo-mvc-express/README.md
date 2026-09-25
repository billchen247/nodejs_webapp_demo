# todo-mongo-mvc-express

**A server-rendered Todo web app** built with Express 5, TypeScript, MongoDB (Mongoose), and the EJS view engine — the same stack as `todo-mongo-api-express`, but rendering HTML instead of JSON.

| Concern              | Choice                            | Why |
| -------------------- | --------------------------------- | --- |
| Runtime              | Node.js ≥ 22, ESM                 | Native `import`, no transpiler at runtime |
| Language             | TypeScript 5 (strict)             | Types on request/response boundaries |
| HTTP framework       | **Express 5**                     | Async errors auto-forward, real router |
| Database             | **MongoDB**                       | The 'M' in MERN |
| ODM                  | **Mongoose 8**                    | Schema + validation + typed models |
| View engine          | **EJS**                           | HTML with `<% %>` tags — closest to plain HTML |
| Form → verb bridge   | **method-override**               | Lets `<form>` submit PUT / DELETE |
| Validation           | Zod 3                             | One declaration → runtime check + TS type |
| Security             | Helmet + rate-limit               | Sensible defaults out of the box |
| Ops                  | morgan + compression              | Request logs + gzip |
| Tests                | Vitest + supertest + `mongodb-memory-server` | Real Mongo semantics, no external service |

---

## Why this project exists

`todo-mongo-api-express` is a **JSON REST API**. Every route ends in `res.json(...)`. This project keeps the same stack — Express 5, TypeScript, Mongoose — but every route ends in `res.render("...", locals)` or `res.redirect("...")`. Diffing the two is the most concise answer to *"what changes when you switch from a REST API to a server-rendered MVC app?"*

Concretely, three things move:

1. **The controllers** return HTML instead of JSON.
2. **A view layer appears** — `views/**/*.ejs` templates rendered by EJS.
3. **Form-shaped input** takes over: `application/x-www-form-urlencoded` bodies, and the `method-override` middleware upgrades `<form method="post">` to real PUT and DELETE requests.

---

## Quick start

```bash
# 1. Point at a MongoDB instance. Any of these work:
#      * local mongod:  brew services start mongodb-community  (macOS)
#      * Docker:        docker run -d -p 27017:27017 --name mongo mongo:7
#      * Atlas:         copy the SRV connection string from the UI
cp .env.example .env
# ...edit MONGODB_URI in .env if you need to.

# 2. Install & run
npm install
npm run dev             # tsx watch, hot reload
# or
npm run build && npm start
```

Then open:

* **Home page:**   http://localhost:3004/
* **Todo list:**   http://localhost:3004/todos
* **New todo:**    http://localhost:3004/todos/new

The five sibling projects default to ports 3000 / 3001 / 3002 / 3003, so all six can run at once.

---

## Routes (classic RESTful actions)

| Method | Path                       | Action           | Renders / does                                  |
| ------ | -------------------------- | ---------------- | ----------------------------------------------- |
| GET    | `/`                        | home             | `views/home.ejs`                                |
| GET    | `/todos`                   | index            | `views/todos/index.ejs` (list with filters)     |
| GET    | `/todos/new`               | new              | `views/todos/new.ejs` (create form)             |
| POST   | `/todos`                   | create           | 302 → `/todos`                                  |
| GET    | `/todos/:id`               | show             | `views/todos/show.ejs` (detail page)            |
| GET    | `/todos/:id/edit`          | edit             | `views/todos/edit.ejs` (edit form)              |
| PUT    | `/todos/:id`               | update           | 302 → `/todos`                                  |
| POST   | `/todos/:id/toggle`        | toggle completed | 302 → `/todos`                                  |
| DELETE | `/todos/:id`               | destroy          | 302 → `/todos`                                  |

`PUT` and `DELETE` are submitted from HTML forms via `?_method=PUT` / `?_method=DELETE`, translated by the `method-override` middleware.

Query params on `/todos`:

* `?filter=all` (default), `?filter=active`, `?filter=completed`

---

## Layout — the MVC pieces

```
todo-mongo-mvc-express/
├── src/
│   ├── server.ts               ← entry point: connect Mongo, listen, shutdown
│   ├── app.ts                  ← Express + view engine + middleware wiring
│   ├── config.ts               ← env vars in one place (dotenv-loaded)
│   ├── db.ts                   ← Mongoose connect / disconnect
│   ├── routes/todos.ts         ← the /todos router (7 RESTful actions + toggle)
│   ├── controllers/
│   │   ├── home.ts             ← GET /
│   │   └── todos.ts            ← index / new / create / show / edit / update / delete
│   ├── middleware/errors.ts    ← notFound + errorHandler (renders HTML error pages)
│   ├── models/todo.ts          ← Mongoose schema + Model + toJSON transform  (M)
│   ├── schemas/todo.ts         ← Zod form-input schemas
│   └── utils/http-error.ts     ← HttpError class
├── views/                      ← EJS templates                                (V)
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── todos/
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   ├── show.ejs
│   │   └── edit.ejs
│   ├── home.ejs
│   ├── 404.ejs
│   └── error.ejs
├── public/styles.css           ← static assets served at /
├── test/todos.test.ts          ← Vitest + supertest + mongodb-memory-server
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

`src/controllers/todos.ts` is where the **C** in MVC lives. Each handler reads request state, calls the model, and calls `res.render(view, locals)` or `res.redirect(url)`. It never touches the DB directly or emits HTML directly.

---

## Testing

```bash
npm test                # one-shot
npm run test:watch      # watch mode
npm run test:coverage   # + coverage report
```

Tests use `mongodb-memory-server` for a real Mongo binary spun up in-process — no need for a running `mongod`. First run downloads the binary (cached under `~/.cache/mongodb-binary/`).

The tests exercise real HTTP against the app and grep the rendered HTML — deliberately crude, so the assertions read as documentation for the view.

---

## MVC in one screen

```
Browser  ──────►  Route          ──────►  Controller       ──────►  Model
           GET /todos                       listTodos                TodoModel.find(...)
                                              │
                                              ▼
                                          res.render("todos/index", { todos })
                                              │
                                              ▼
Browser  ◄──────────────────────────────  EJS template → HTML
```

A form-based mutation follows the same shape, then finishes with a redirect (Post/Redirect/Get) so the browser lands on a GET page after the POST:

```
Browser  ─── POST /todos ───►  createTodo  ──►  TodoModel.create(...)  ──►  res.redirect("/todos")
Browser  ◄─── 302 Location: /todos
Browser  ─── GET /todos ────►  listTodos   (fresh page — no double-submit on refresh)
```

---

## Where this fits in the learning arc

| # | Project                              | Framework                                       | Store       | Front end             |
| - | ------------------------------------ | ----------------------------------------------- | ----------- | --------------------- |
| 1 | `../todo-node-api`                   | raw `http`                                      | JSON file   | (JSON only)           |
| 2 | `../todo-connect-api`                | Connect (Express's minimalist ancestor)         | JSON file   | (JSON only)           |
| 3 | `../todo-express-api`                | Express 4                                       | JSON file   | (JSON only)           |
| 4 | `../todo-node-api-express`           | Express 5 + TypeScript + ESM                    | JSON file   | (JSON only)           |
| 5 | `../todo-mongo-api-express`          | Express 5 + TypeScript + ESM                    | MongoDB     | (JSON only)           |
| 6 | **this one — `todo-mongo-mvc-express`** | Express 5 + TypeScript + ESM + **EJS**       | MongoDB     | **Server-rendered**   |

Reading 1 → 4 answers *"why do people use Express?"*. Reading 4 → 5 answers *"why do people use a real database?"*. Reading 5 → 6 answers *"what does a classic server-rendered MVC app look like on the same stack?"*.

---

## License

MIT — see the repo-level [`LICENSE`](../LICENSE).
