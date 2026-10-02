# Week 2 — Express REST API

> **Question of the week:** *How do we build an API?*

In Week 1 we routed by hand with the `http` module. This week we introduce
**Express** and gain the full CRUD surface — `POST`, `PUT`, `DELETE` — on top
of the GETs we already had.

Data is still an in-memory array. We will swap it for MongoDB in Week 3.

---

## What this week teaches

- The Express framework: `app`, `Router`, middleware, request parsing.
- Thinking in **REST**: resources, HTTP verbs, status codes (200 / 201 / 204 / 400 / 404).
- Splitting a server into **routes** and **controllers**.
- Validating request bodies at the HTTP boundary.
- Writing **API tests with Supertest** against an Express app (no port required).

---

## Project layout

```
week02-express-rest-api/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── week02-express-rest-api.md
│   └── week02-changes-from-week01.md
├── src/
│   ├── server.ts                   # boots the app on a port
│   ├── app.ts                      # Express app factory (test-friendly)
│   ├── routes/
│   │   └── taskRoutes.ts
│   ├── controllers/
│   │   └── taskController.ts
│   └── data/
│       └── tasks.ts                # still in-memory
└── tests/
    └── taskApi.test.ts             # Supertest-based API tests
```

---

## Installation

```bash
cd week02-express-rest-api
npm install
```

As always, delete any `package-lock.json` that `npm install` creates.

Copy the environment template:

```bash
cp .env.example .env
```

| Variable | Purpose                           | Default |
|----------|-----------------------------------|---------|
| `PORT`   | HTTP port Express listens on      | `3000`  |

---

## Running

```bash
npm run dev
# or
npm start
```

Smoke-test with curl:

```bash
curl http://localhost:3000/api/tasks
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"milk, bread"}'
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
curl -X DELETE http://localhost:3000/api/tasks/1
```

---

## Running tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

Coverage report lands in `coverage/`.

---

## API endpoints

| Method | Path             | Body                                               | Success | Errors        |
|--------|------------------|----------------------------------------------------|---------|---------------|
| GET    | `/`              | —                                                  | 200     | —             |
| GET    | `/api/tasks`     | —                                                  | 200     | —             |
| GET    | `/api/tasks/:id` | —                                                  | 200     | 400, 404      |
| POST   | `/api/tasks`     | `{ title, description?, completed? }`              | 201     | 400           |
| PUT    | `/api/tasks/:id` | any subset of `{ title, description, completed }`  | 200     | 400, 404      |
| DELETE | `/api/tasks/:id` | —                                                  | 204     | 400, 404      |

---

## Important files

- `src/app.ts` — builds the Express `app`, registers middleware and routes.
- `src/routes/taskRoutes.ts` — maps verbs + paths to controller functions.
- `src/controllers/taskController.ts` — HTTP-aware handlers.
- `src/data/tasks.ts` — in-memory CRUD helpers, plus the `Task` interface and
  `NewTaskInput` / `TaskUpdateInput` types.
- `tests/taskApi.test.ts` — hits every endpoint through Supertest.

---

## New dependencies this week

- `express` + `@types/express` — the web framework.
- `supertest` + `@types/supertest` — ergonomic HTTP tests against an Express app.

---

## Architecture

```
       Supertest / curl / browser
                   │
                   ▼
            ┌──────────────┐
            │   Express    │  src/app.ts
            │   (routers)  │  src/routes/taskRoutes.ts
            └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Controllers  │  src/controllers/taskController.ts
            └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │ In-memory    │  src/data/tasks.ts
            │ tasks array  │
            └──────────────┘
```

---

## Suggested classroom demonstration

1. Show the `handleRequest` function from Week 1 side-by-side with
   `src/app.ts` and `src/routes/taskRoutes.ts`. Point at every piece of
   code Express makes disappear (URL parsing, method matching, JSON parsing).
2. Walk through the controller methods — note how each returns a sensible
   status code (`201`, `204`, `400`, `404`) depending on what happened.
3. Run `npm run test`, then open `tests/taskApi.test.ts` and show how
   Supertest chains a verb, a path, and `.send(body)`.
4. Point out that the controller never trusts a client-supplied `id` on
   POST — a preview of the security conversation coming in Weeks 6–7.

---

## What students should understand after this lesson

- Express is a thin layer on top of `http` that handles routing, middleware,
  and JSON parsing for us.
- A REST API maps resources (`/api/tasks`) and verbs (`GET`, `POST`,
  `PUT`, `DELETE`) to intent (list, create, update, delete).
- Which status code goes with which outcome.
- Why controllers call into a data layer instead of touching storage directly:
  the data layer is the one piece that changes next week.
- How to write an API test without starting a real server.
