# todo-mongo-mvc-express

**A server-rendered classic Task Manager** — Users, Projects, and Tasks — built with Express 5, TypeScript, MongoDB (Mongoose), and the EJS view engine. Session-based auth with bcrypt-hashed passwords. The original single-user **Todo** demo is preserved alongside as the intro example.

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
| Session store        | **express-session + connect-mongo** | Server-side sessions in Mongo, cookie-signed session ID |
| Password hashing     | **bcryptjs**                      | Pure-JS, no native compile |
| Security             | Helmet + rate-limit               | Sensible defaults out of the box |
| Ops                  | morgan + compression              | Request logs + gzip |
| Tests                | Vitest + supertest + `mongodb-memory-server` | Real Mongo semantics, no external service |

---

## What this project demonstrates

* Classic **MVC** on the same stack as its JSON-API sibling `todo-mongo-api-express`, but every route ends in `res.render(view, locals)` or `res.redirect(url)`.
* **Ownership-based authorisation** — anyone signed in can *view* every project, but only the owner can edit or delete it (or its tasks).
* **Nested resources** — tasks live under `/projects/:projectId/tasks/…`, wired via `Router({ mergeParams: true })`.
* **Session auth** — signup / login / logout with server-side sessions, session regeneration on privilege change to defeat session-fixation, `req.currentUser` injected on every request.
* **Two coexisting resources** in one app — the richer Task Manager and the older Todo demo — so you can diff the minimal shape against the more realistic one.

---

## Quick start

```bash
# 1. Point at a MongoDB instance. Any of these work:
#      * local mongod:  brew services start mongodb-community  (macOS)
#      * Docker:        docker run -d -p 27017:27017 --name mongo mongo:7
#      * Atlas:         copy the SRV connection string from the UI
cp .env.example .env
# ...edit MONGODB_URI + SESSION_SECRET in .env if you need to.

# 2. Install & run
npm install
npm run dev             # tsx watch, hot reload
# or
npm run build && npm start
```

Then open:

* **Home page:**   http://localhost:3004/
* **Sign up:**     http://localhost:3004/signup
* **Projects:**    http://localhost:3004/projects (redirects to /login if signed out)
* **Legacy todos:** http://localhost:3004/todos (open access — no auth)

---

## Domain model

```
User ──────► owns ──────► Project ──────► has many ──────► Task
   │                          │                              │
   │                          │                              └── optional assignee ──► User
   │                          │
   └── may be assignee of ────┘

Todo   (legacy demo — one flat collection, no auth)
```

* **User** — `name`, `email` (unique, lowercased), `passwordHash` (bcryptjs; hidden from every query by default). Instance methods: `setPassword(plain)`, `verifyPassword(plain)`. Static: `findByEmail(email)`.
* **Project** — `name`, `description`, `owner` (`User` ref). Unique on `(owner, name)` case-insensitively so one user can't have two "Website Redesign" projects, but two users can share the name.
* **Task** — `title`, `description`, `status` (`todo | in_progress | done`), `priority` (`low | medium | high`), `dueDate` (nullable), `project` (`Project` ref), `assignee` (`User` ref, nullable), `createdBy` (`User` ref).
* **Todo** — unchanged from the original demo. Fields: `title`, `completed`.

---

## Routes

### Auth (open access)

| Method | Path       | Action                                    |
| ------ | ---------- | ----------------------------------------- |
| GET    | `/signup`  | Signup form                               |
| POST   | `/signup`  | Create account, log in, redirect          |
| GET    | `/login`   | Login form                                |
| POST   | `/login`   | Verify creds, log in, redirect            |
| POST   | `/logout`  | Destroy session, redirect                 |

### Users (requires auth)

| Method | Path                       | Action                            |
| ------ | -------------------------- | --------------------------------- |
| GET    | `/users`                   | Directory of all users            |
| GET    | `/users/:id`               | Someone's profile + their projects |
| GET    | `/users/me/edit`           | Edit my profile                   |
| PUT    | `/users/me`                | Update my name / email            |
| POST   | `/users/me/password`       | Change my password                |

### Projects (requires auth)

| Method | Path                       | Action                                    |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | `/projects`                | Index (filterable via `?scope=all\|mine`) |
| GET    | `/projects/new`            | New form                                  |
| POST   | `/projects`                | Create                                    |
| GET    | `/projects/:id`            | Show (kanban board of tasks)              |
| GET    | `/projects/:id/edit`       | Edit form (owner only)                    |
| PUT    | `/projects/:id`            | Update (owner only)                       |
| DELETE | `/projects/:id`            | Destroy (owner only; cascades to tasks)   |

### Tasks — nested under projects (requires auth)

| Method | Path                                              | Action                          |
| ------ | ------------------------------------------------- | ------------------------------- |
| GET    | `/projects/:projectId/tasks/new`                  | New form (owner only)           |
| POST   | `/projects/:projectId/tasks`                      | Create (owner only)             |
| GET    | `/projects/:projectId/tasks/:id`                  | Show                            |
| GET    | `/projects/:projectId/tasks/:id/edit`             | Edit form (owner only)          |
| PUT    | `/projects/:projectId/tasks/:id`                  | Update (owner only)             |
| POST   | `/projects/:projectId/tasks/:id/status`           | Quick "move column" on the board (owner only) |
| DELETE | `/projects/:projectId/tasks/:id`                  | Destroy (owner only)            |

### Todos — legacy demo (open access)

Unchanged from the original project — see the routes table in the previous version of this README (`GET /todos`, `GET /todos/new`, `POST /todos`, `GET /todos/:id`, `GET /todos/:id/edit`, `PUT /todos/:id`, `POST /todos/:id/toggle`, `DELETE /todos/:id`).

`PUT` and `DELETE` on any of these routes are submitted from HTML forms via `?_method=PUT` / `?_method=DELETE`, translated by the `method-override` middleware.

---

## Layout

```
todo-mongo-mvc-express/
├── src/
│   ├── server.ts               ← entry point: connect Mongo, listen, shutdown
│   ├── app.ts                  ← Express + view engine + session + middleware + routes
│   ├── config.ts               ← env vars in one place (dotenv-loaded)
│   ├── db.ts                   ← Mongoose connect / disconnect
│   ├── routes/
│   │   ├── auth.ts             ← /signup, /login, /logout
│   │   ├── users.ts            ← /users + /users/me profile edit
│   │   ├── projects.ts         ← /projects + mounts nested /tasks
│   │   ├── tasks.ts            ← /projects/:projectId/tasks router
│   │   └── todos.ts            ← legacy /todos router
│   ├── controllers/
│   │   ├── home.ts             ← GET /
│   │   ├── auth.ts             ← signup / login / logout
│   │   ├── users.ts            ← user directory + profile edit
│   │   ├── projects.ts         ← project CRUD
│   │   ├── tasks.ts            ← task CRUD + status change
│   │   └── todos.ts            ← legacy todo CRUD
│   ├── middleware/
│   │   ├── auth.ts             ← injectCurrentUser + requireAuth
│   │   ├── flash.ts            ← one-time session-backed messages
│   │   └── errors.ts           ← notFound + errorHandler
│   ├── models/
│   │   ├── user.ts             ← Mongoose schema + methods (setPassword, verifyPassword)
│   │   ├── project.ts          ← Mongoose schema (owner: User ref)
│   │   ├── task.ts             ← Mongoose schema (project + assignee + createdBy refs)
│   │   └── todo.ts             ← legacy Mongoose schema
│   ├── schemas/
│   │   ├── user.ts             ← signup / login / profile / password Zod schemas
│   │   ├── project.ts          ← project create/update Zod schemas
│   │   ├── task.ts             ← task create/update/status Zod schemas
│   │   └── todo.ts             ← legacy todo Zod schemas
│   ├── types/
│   │   └── session.d.ts        ← augments express-session's SessionData
│   └── utils/
│       ├── http-error.ts       ← HttpError class
│       └── flatten-zod.ts      ← ZodError → { field: message } map
├── views/                      ← EJS templates                                (V)
│   ├── partials/{header,footer}.ejs
│   ├── auth/{login,signup}.ejs
│   ├── users/{index,show,edit}.ejs
│   ├── projects/{index,new,show,edit}.ejs
│   ├── tasks/{new,show,edit,_form}.ejs
│   ├── todos/{index,new,show,edit}.ejs
│   ├── home.ejs
│   ├── 404.ejs
│   └── error.ejs
├── public/styles.css           ← static assets served at /
├── test/
│   ├── auth.test.ts            ← signup / login / logout / auth guard
│   ├── projects.test.ts        ← /projects CRUD (with auth)
│   ├── tasks.test.ts           ← /projects/:pid/tasks CRUD (with auth)
│   └── todos.test.ts           ← legacy /todos suite
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Session + auth in one screen

```
Anonymous request
    │
    ▼
express-session middleware   (reads/creates session in Mongo)
    │
    ▼
flash middleware             (copies req.session.flash → res.locals.flash)
    │
    ▼
injectCurrentUser            (loads User by req.session.userId, sets res.locals.currentUser)
    │
    ├─────► requireAuth  (on /projects, /users, /tasks) → redirect to /login if anonymous
    │
    ▼
Controller runs
    │
    └── on login/signup: req.session.regenerate() + req.session.userId = user.id
    └── on logout      : req.session.destroy() + res.clearCookie(SESSION_COOKIE_NAME)
```

The **session store** is `connect-mongo`, which reuses Mongoose's live `MongoClient` — no second connection just for sessions. Under `NODE_ENV=test` the app falls back to express-session's default in-process `MemoryStore` so the test suite stays hermetic.

---

## Testing

```bash
npm test                # one-shot
npm run test:watch      # watch mode
npm run test:coverage   # + coverage report
```

Tests use `mongodb-memory-server` for a real Mongo binary spun up in-process — no need for a running `mongod`. The auth / projects / tasks tests use supertest's `agent()` so cookies persist across requests within a scenario (the same way a browser would).

---

## Where this fits in the learning arc

| # | Project                              | Framework                                       | Store       | Front end             |
| - | ------------------------------------ | ----------------------------------------------- | ----------- | --------------------- |
| 1 | `../todo-node-api`                   | raw `http`                                      | JSON file   | (JSON only)           |
| 2 | `../todo-connect-api`                | Connect (Express's minimalist ancestor)         | JSON file   | (JSON only)           |
| 3 | `../todo-express-api`                | Express 4                                       | JSON file   | (JSON only)           |
| 4 | `../todo-node-api-express`           | Express 5 + TypeScript + ESM                    | JSON file   | (JSON only)           |
| 5 | `../todo-mongo-api-express`          | Express 5 + TypeScript + ESM                    | MongoDB     | (JSON only)           |
| 6 | **this one — `todo-mongo-mvc-express`** | Express 5 + TypeScript + ESM + **EJS + session auth** | MongoDB     | **Server-rendered**   |

Reading 1 → 4 answers *"why do people use Express?"*. Reading 4 → 5 answers *"why do people use a real database?"*. Reading 5 → 6 answers *"what does a classic multi-user server-rendered MVC app look like on the same stack?"*.

---

## License

MIT — see the repo-level [`LICENSE`](../LICENSE).
