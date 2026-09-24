# Node.js Web App Demo — four Todo REST APIs, one learning arc

This repo contains **four implementations of the same tiny Todo REST API**,
each written on a different layer of the Node.js web stack. Reading them in
order shows what a framework *actually adds* — every project keeps the same
routes, the same JSON-file "database", and (where practical) the same tests,
so the only thing that changes between projects is the framework layer.

| # | Project                                                    | Framework layer                        | Language / modules | Node engine |
| - | ---------------------------------------------------------- | -------------------------------------- | ------------------ | ----------- |
| 1 | [`todo-node-api`](./todo-node-api)                         | none — raw `http` module               | JavaScript / CJS   | ≥ 24        |
| 2 | [`todo-connect-api`](./todo-connect-api)                   | [Connect](https://github.com/senchalabs/connect) middleware | JavaScript / CJS   | ≥ 24        |
| 3 | [`todo-express-api`](./todo-express-api)                   | [Express 4](https://expressjs.com/)    | JavaScript / CJS   | ≥ 24        |
| 4 | [`todo-node-api-express`](./todo-node-api-express)         | [Express 5](https://expressjs.com/2024/10/15/v5-release.html) + Zod + Helmet | **TypeScript / ESM** | ≥ 22        |

Each project has its own detailed README — start there for API docs,
architecture notes, and side-by-side comparisons with its siblings.

---

## The learning progression

1. **`todo-node-api`** — build a working REST API with **only Node's built-in
   modules**. No dependencies at runtime. You write the router, the body
   parser, the CORS handler, and the error boundary yourself. Read this
   first to understand *what a framework is going to take over for you*.

2. **`todo-connect-api`** — introduce **middleware** via Connect, the
   ~200-line ancestor of Express. Same behaviour as #1, but CORS, body
   parsing, and the error boundary become `(req, res, next)` functions in a
   chain. The router is still hand-written.

3. **`todo-express-api`** — swap Connect for **Express 4**. The router,
   response helpers, JSON parsing, and static file serving all collapse
   into one-line calls. Same behaviour as #1 and #2 — you're just seeing
   how much ergonomic sugar Express layers on top of Connect.

4. **`todo-node-api-express`** — the **modern production stack**: Express 5,
   TypeScript with strict flags, ESM, Zod for request validation, Helmet /
   CORS / morgan / rate-limit / compression, `swagger-ui-express`, and
   Vitest + supertest. This is what a new Node service in 2026 would
   plausibly look like.

Reading 1 → 4 answers the question *"why do people use Express?"* better
than any tutorial, because the behaviour is held constant and only the
plumbing changes.

---

## Running any project

Each project follows the same convention:

```bash
cd <project-dir>
npm install          # projects 2–4 only; project 1 has zero deps
npm run dev          # watch mode
npm start            # plain run
npm test             # tests
```

Ports and endpoints are documented in each project's own README. Every
project ships a browsable landing page and interactive Swagger UI once the
server is running.

---

## Project layout

```
nodejs_webapp_demo/
├── LICENSE
├── README.md                  ← you are here
├── todo-node-api/             ← 1. raw http, no framework
├── todo-connect-api/          ← 2. Connect middleware
├── todo-express-api/          ← 3. Express 4
└── todo-node-api-express/     ← 4. Express 5 + TypeScript + ESM
```

---

## License

MIT — see [`LICENSE`](./LICENSE).
