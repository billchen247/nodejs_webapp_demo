# Week 3 — MongoDB + Mongoose

> **Question of the week:** *How do we persist data?*

Our API from Week 2 was fully functional, but every restart wiped the tasks
list because data lived in a plain JavaScript array. This week we introduce
**MongoDB** and the **Mongoose** ODM so tasks survive restarts and we gain
schema-level validation.

---

## What this week teaches

- The idea of a database, a collection, and a document.
- MongoDB basics: how to run it locally, how MongoDB Compass helps you look at data.
- **Mongoose:** schemas, models, defaults, timestamps, validation, `findById`.
- Separating a TypeScript interface, a Mongoose schema, and a MongoDB document.
- `async` / `await` across the whole data layer.
- Testing against an **in-memory MongoDB** (`mongodb-memory-server`) so tests
  never touch your real database.

---

## Project layout

```
week03-mongodb-mongoose/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── week03-mongodb-mongoose.md
│   └── week03-changes-from-week02.md
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   └── Task.ts
│   ├── routes/
│   │   └── taskRoutes.ts
│   └── controllers/
│       └── taskController.ts
└── tests/
    ├── setup.ts
    ├── taskModel.test.ts
    └── taskApi.test.ts
```

---

## Prerequisites

You need MongoDB running locally.

- **macOS (Homebrew):** `brew tap mongodb/brew && brew install mongodb-community@7.0 && brew services start mongodb-community@7.0`
- **Windows / Linux:** download the Community Server from
  <https://www.mongodb.com/try/download/community>.

MongoDB Compass is optional but recommended — it is a GUI for browsing
collections and documents.

---

## Installation

```bash
cd week03-mongodb-mongoose
npm install
cp .env.example .env
```

| Variable       | Purpose                                 | Example                                                     |
|----------------|-----------------------------------------|-------------------------------------------------------------|
| `PORT`         | HTTP port                               | `3000`                                                      |
| `MONGODB_URI`  | Connection string for development/prod  | `mongodb://127.0.0.1:27017/mern_task_manager_week03`        |

> Tests do **not** need `MONGODB_URI` — they boot an in-memory MongoDB.

---

## Running

```bash
npm run dev
# or
npm start
```

Smoke-test:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries"}'
curl http://localhost:3000/api/tasks
# Restart the server. Hit GET again — the task is still there.
```

---

## Running tests

```bash
npm run test
npm run test:coverage
```

The first run downloads a MongoDB binary; subsequent runs are fast.

---

## API endpoints

Identical shape to Week 2 — the only real differences:

- `id` is now a 24-character MongoDB ObjectId string instead of a small integer.
- Responses include `createdAt` and `updatedAt`.
- Validation errors return a `details` object with per-field messages.

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

- `src/models/Task.ts` — the schema (source of truth) + a derived TS type.
- `src/config/database.ts` — only place that imports `mongoose.connect`.
- `src/controllers/taskController.ts` — same shape as Week 2, now using
  `Task.find / findById / create / findByIdAndUpdate / findByIdAndDelete`.
- `tests/setup.ts` — spins up `mongodb-memory-server` for the test suite.
- `tests/taskModel.test.ts` — tests on the schema itself (defaults, validation).
- `tests/taskApi.test.ts` — tests on the API (shape unchanged from Week 2).

---

## New dependencies this week

- `mongoose` — the ODM that gives us schemas, models, validation.
- `dotenv` — load `.env` into `process.env` at startup.
- `mongodb-memory-server` (dev) — in-process MongoDB for tests.

---

## Architecture

```
          Supertest / curl / browser
                     │
                     ▼
              ┌──────────────┐
              │   Express    │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Controllers  │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   Mongoose   │   src/models/Task.ts
              │   (schema)   │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   MongoDB    │
              └──────────────┘
```

---

## Suggested classroom demonstration

1. Point students at `src/data/tasks.ts` from Week 2, and `src/models/Task.ts`
   here. Same concept (shape of a task), very different responsibilities.
2. Walk through the "interface → schema → document" sentence in the model file.
3. Run `npm run dev` and `POST` a task, then stop the server, start it again,
   and `GET` the task back. The data survived.
4. Open MongoDB Compass and show the `tasks` collection.
5. Run `npm run test`. Open `tests/setup.ts` and talk about why the in-memory
   DB matters.
6. Deliberately send a bad POST (empty title) and look at the 400 response.

---

## What students should understand after this lesson

- Data in Node must live *somewhere* that survives a restart. MongoDB is
  one answer; Postgres and Redis are others.
- A Mongoose schema plays three roles: it describes the shape, enforces
  validation, and gives us a type-safe `Task` model.
- Why `createdAt` and `updatedAt` almost always belong on a resource.
- Why we test against an in-memory MongoDB — real databases are too slow
  and too dangerous for a test suite.
