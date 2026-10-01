# todo-mern-fullstack

> **Author:** Bill Chen
> **Purpose:** Student learning project — a full **MERN** stack TODO app
> (**M**ongoDB · **E**xpress · **R**eact · **N**ode.js) wired together in a
> single workspace. Everything is written in **modern TypeScript** on the
> latest versions of each library so you can see how they fit together
> end-to-end.

This project is the natural next step after `todo-mongo-api-express` (which
is API-only). Here, the same style of REST API now has a real React UI that
talks to it in the browser.

```
┌─────────────────────┐         HTTP / JSON          ┌─────────────────────┐
│   React 19 + Vite   │ ──────── fetch ────────────► │  Express 5 + TS     │
│  TypeScript (web)   │ ◄──────── JSON ────────────  │  Mongoose + MongoDB │
└─────────────────────┘                              └─────────────────────┘
     :5173 (dev)                                              :4000
```

---

## Tech stack (latest, 2026)

| Layer         | Library            | Why we're using it                                   |
|---------------|--------------------|------------------------------------------------------|
| Runtime       | Node.js ≥ 22       | Native ESM, modern JS features                       |
| HTTP server   | Express **5**      | Mature, de-facto standard, async-friendly            |
| ODM           | Mongoose **8**     | Typed schema layer over the MongoDB driver           |
| Database      | MongoDB **7+**     | Document store — a great fit for free-form TODOs     |
| Validation    | Zod **3**          | Runtime schema validation that mirrors TS types      |
| UI framework  | React **19**       | Latest React with built-in `use`, Actions, etc.      |
| Build tool    | Vite **6**         | Instant dev server, tiny bundles                     |
| Language      | TypeScript **5.6** | Strict mode across both backend and frontend         |

---

## Directory layout

```
todo-mern-fullstack/
├── README.md                 ← you are here
├── backend/                  ← Express 5 + Mongoose REST API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts         ← HTTP server bootstrap
│       ├── app.ts            ← Express app assembly
│       ├── db.ts             ← Mongo connect / disconnect
│       ├── config/index.ts   ← env → typed config
│       ├── models/Todo.ts    ← Mongoose schema + model
│       ├── routes/todos.ts   ← REST routes
│       ├── controllers/todos.ts ← request handlers
│       └── middleware/
│           ├── errorHandler.ts
│           └── notFound.ts
│
└── frontend/                 ← React 19 + Vite + TS SPA
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx          ← React entry point
        ├── App.tsx           ← root component
        ├── App.css
        ├── types/todo.ts     ← shared Todo type
        ├── api/todos.ts      ← fetch wrapper for the REST API
        ├── hooks/useTodos.ts ← custom hook holding todo state
        └── components/
            ├── TodoForm.tsx
            ├── TodoList.tsx
            └── TodoItem.tsx
```

---

## Prerequisites

1. **Node.js ≥ 22** — `node --version`
2. **MongoDB running locally** on `mongodb://localhost:27017`
   - Easiest option: `brew install mongodb-community && brew services start mongodb-community`
   - Or Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`

---

## Running the project

Open **two terminal tabs** (one for backend, one for frontend).

### Terminal 1 — backend

```bash
cd backend
cp .env.example .env       # one-time; edit values if you need to
npm install
npm run dev                # starts the API on http://localhost:4000
```

Quick smoke test:

```bash
curl http://localhost:4000/api/todos          # [] on a fresh DB
curl -X POST http://localhost:4000/api/todos \
     -H "Content-Type: application/json" \
     -d '{"title":"Learn MERN"}'
```

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev                # opens http://localhost:5173
```

Vite is configured to **proxy** `/api` requests to the backend, so the browser
code can just call `fetch("/api/todos")` and it will reach the Express server
transparently.

---

## REST API

| Verb   | Path               | Body                                | Response       |
|--------|--------------------|-------------------------------------|----------------|
| GET    | `/api/todos`       | —                                   | `Todo[]`       |
| GET    | `/api/todos/:id`   | —                                   | `Todo`         |
| POST   | `/api/todos`       | `{ title, completed? }`             | `Todo` (201)   |
| PATCH  | `/api/todos/:id`   | `{ title?, completed? }`            | `Todo`         |
| DELETE | `/api/todos/:id`   | —                                   | `204 No Content` |

`Todo` shape:

```ts
{
    id: string;           // Mongo _id as a string
    title: string;
    completed: boolean;
    createdAt: string;    // ISO date
    updatedAt: string;
}
```

---

## What to read first

1. `backend/src/server.ts` — how a Node process actually starts an HTTP server
2. `backend/src/app.ts` — how Express middleware & routes are composed
3. `backend/src/models/Todo.ts` — Mongoose schema
4. `backend/src/controllers/todos.ts` — the CRUD handlers
5. `frontend/src/App.tsx` — the top-level React component
6. `frontend/src/hooks/useTodos.ts` — React state management for the list
7. `frontend/src/api/todos.ts` — how the browser talks to the API

Every file has an `@author Bill Chen` header and verbose teaching comments.
Treat them as the textbook.

---

## Sister projects for comparison

- `../todo-node-api` — raw `http` module, no framework
- `../todo-connect-api` — Connect middleware
- `../todo-express-api` — classic Express 4
- `../todo-node-api-express` — Express 5 + TS + JSON file persistence
- `../todo-mongo-api-express` — Express 5 + TS + MongoDB **(API only)**
- **`todo-mern-fullstack`** — Full MERN with React frontend ← _you are here_
