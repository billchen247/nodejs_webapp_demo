# Week 1 — Node.js Basics

> **Question of the week:** *What is Node.js?*

This is the first week of the 10-week MERN Task Manager classroom project.
We use **TypeScript** and **only Node's built-in `http` module** — no Express,
no database, no React. The goal is to understand what Node actually is before
we start piling frameworks on top of it.

---

## What this week teaches

- What the Node.js runtime is and how to run TypeScript on it (with `tsx`).
- `npm`, `package.json`, and npm scripts.
- ES Modules (`import` / `export`) in TypeScript.
- The low-level HTTP request/response lifecycle.
- URLs, paths, HTTP methods, status codes, and JSON.
- Reading configuration from environment variables.
- Writing your first unit tests and HTTP tests with **Vitest**.

---

## Project layout

```
week01-node-basics/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   └── week01-node-basics.md
├── src/
│   ├── server.ts         # Node http server and request router
│   └── data/
│       └── tasks.ts      # In-memory task "database"
└── tests/
    └── tasks.test.ts     # Unit + integration tests
```

---

## Installation

```bash
cd week01-node-basics
npm install
```

> **Important:** this classroom project intentionally does **not** keep
> `package-lock.json` in version control. If `npm install` creates one,
> delete it before committing — the `.gitignore` already excludes it.

## Configure `.env`

Copy the example file and tweak as needed:

```bash
cp .env.example .env
```

| Variable | Purpose                                 | Default |
|----------|-----------------------------------------|---------|
| `PORT`   | HTTP port the server listens on         | `3000`  |

---

## Running the server

```bash
npm run dev       # watch mode — restarts on save
npm start         # one-shot run
```

Then try:

```bash
curl http://localhost:3000/
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/tasks/1
curl -i http://localhost:3000/api/tasks/999   # 404
curl -i http://localhost:3000/api/tasks/abc   # 400
curl -i -X POST http://localhost:3000/api/tasks  # 405
```

---

## Running tests

```bash
npm run test              # one-shot run
npm run test:watch        # re-run on file changes
npm run test:coverage     # generate a coverage report
```

Coverage output lands in `coverage/` (ignored by git). Open
`coverage/index.html` in a browser to see line-by-line coverage.

---

## API endpoints (Week 1)

| Method | Path             | Description                | Status codes          |
|--------|------------------|----------------------------|-----------------------|
| GET    | `/`              | Welcome payload            | 200                   |
| GET    | `/api/tasks`     | List all tasks             | 200                   |
| GET    | `/api/tasks/:id` | Fetch one task by numeric id | 200 / 400 / 404     |
| any    | everything else  | Not found / wrong method   | 404 / 405             |

Writes (`POST`, `PUT`, `DELETE`) are **not** supported yet — that is Week 2.

---

## Important files

- `src/server.ts` — reads `req`/writes `res`, routes by path, formats JSON.
- `src/data/tasks.ts` — the in-memory task store and the `Task` interface.
- `tests/tasks.test.ts` — unit tests + HTTP tests against a real server
  bound to a random free port.

---

## Dependencies introduced this week

- `typescript`, `tsx`, `@types/node` — write and run TypeScript on Node.
- `vitest`, `@vitest/coverage-v8` — the test runner and coverage provider.

That is literally everything. There are **no runtime dependencies** yet.

---

## Architecture

```
         curl / browser
                │
                ▼
   ┌────────────────────────┐
   │  Node http.Server      │  src/server.ts
   │  (handleRequest)       │
   └────────────────────────┘
                │
                ▼
   ┌────────────────────────┐
   │  In-memory tasks array │  src/data/tasks.ts
   └────────────────────────┘
```

Everything lives in a single Node process. State is **lost on restart**.
In Week 3 we will replace the array with MongoDB; in Week 2 we will
replace the raw `http` routing with Express.

---

## Suggested classroom demonstration

1. Run `npm run dev` and open the server in a browser.
2. Walk through `src/server.ts` line by line. Point at:
   - the handler signature `(req, res)`,
   - setting `statusCode` and `Content-Type` manually,
   - the ad-hoc regex route match for `/api/tasks/:id`.
3. Stop the server. Note that the tasks reset. Ask: *where does the data live?*
4. Run `npm run test`. Walk through one unit test and one HTTP test.
5. Run `npm run test:coverage` and open the HTML report.

---

## What students should understand after this lesson

- Node.js is a JavaScript (and, via `tsx`, TypeScript) runtime that can
  listen on a port and answer HTTP requests on its own, with no framework.
- An HTTP response is really just a status code, some headers, and a body.
- Routing is pattern-matching on `req.url` and `req.method`.
- Why we are going to want **Express** in Week 2 — the manual routing above
  does not scale.
- What a test file looks like, and the difference between a unit test
  (calls a function directly) and an integration test (hits the real server).
