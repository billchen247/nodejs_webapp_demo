# MERN Task Manager — a 10-week teaching project

One continuous application, grown one week at a time. By the end of
Week 10 it is a cookie-authenticated, role-aware, rate-limited task
manager with a React frontend and a Node + Express + MongoDB
backend. Every week is a complete, independently runnable snapshot of
the project at that point in the course.

## How this project is organized

```
mern-task-manager/
├── README.md                       ← you are here
├── week01-node-basics/             ← http module only
├── week02-express-rest-api/        ← Express + routes/controllers
├── week03-mongodb-mongoose/        ← + Mongo + Mongoose model
├── week04-react-frontend/          ← + Vite React UI (mock data)
├── week05-mern-fullstack/          ← wires React to the REST API
├── week06-authentication/          ← + JWT in HttpOnly cookies
├── week07-protected-api/           ← + per-user ownership
├── week08-react-authentication/    ← + AuthContext + router guards
├── week09-authorization/           ← + roles (user / admin)
└── week10-production-security/     ← + helmet, rate limit, validation, reset
```

Each week folder contains:

- `README.md` — install, run, demo commands for that week.
- `docs/weekNN-<topic>.md` — the teaching notes (what, why, how).
- `docs/weekNN-changes-from-weekMM.md` — a precise diff from the
  previous week.
- `.gitignore` — identical across weeks; `package-lock.json` is
  deliberately ignored (classroom rule).
- `.env.example` — every env var the week needs. No secret is ever
  committed.

Weeks 1–3 are server-only. Weeks 4–10 are split into `server/` and
`client/` sub-projects.

## Week-by-week summary

| Week | Focus                       | Introduces                                                               |
| ---- | --------------------------- | ------------------------------------------------------------------------ |
| 1    | Node basics                 | `node:http`, in-memory data, manual routing                              |
| 2    | Express REST                | `express`, routes/controllers, body parsing, status codes                |
| 3    | MongoDB + Mongoose          | `mongoose`, schemas, timestamps, `.env` + `dotenv`                       |
| 4    | React frontend              | Vite, components, hooks, modern plain CSS (variables, Grid, clamp())     |
| 5    | Full MERN                   | `cors`, `fetch` with `credentials`, loading / error UI, `_id`            |
| 6    | Authentication              | `bcrypt`, `jsonwebtoken`, `HttpOnly` cookies, `cookie-parser`            |
| 7    | Protected API + ownership   | `authenticate` middleware, `{ _id, userId }` scoping, 404 vs 403         |
| 8    | React authentication        | `react-router-dom`, `AuthContext`, `ProtectedRoute`, redirects           |
| 9    | Authorization               | `role` field, `requireRole`, admin API, hiding ≠ securing                |
| 10   | Production security         | `helmet`, `express-rate-limit`, `express-validator`, password reset       |

Full details for each week are in that week's own README.

## Prerequisites

- Node.js 20+ (uses `--env-file` and `--watch` flags, both built in).
- A running MongoDB instance from Week 3 onwards. Local is simplest:
  `brew install mongodb-community && brew services start mongodb-community`
  or Docker: `docker run -d -p 27017:27017 mongo:7`.
- Nothing else global — no TypeScript, no CSS framework, no Docker,
  no Redux, no GraphQL.

## Quick start — any week

Weeks 1–3 (server only):

```bash
cd weekNN-<name>
cp .env.example .env            # fill in values (from Week 3 on)
npm install
npm run dev
```

Weeks 4–10 (server + client — two terminals):

```bash
# terminal 1
cd weekNN-<name>/server
cp .env.example .env            # fill in values
npm install
npm run dev

# terminal 2
cd weekNN-<name>/client
npm install
npm run dev                     # Vite dev server on :5173
```

Open the client URL that Vite prints (typically http://localhost:5173).

## Rules this project follows

These rules are repeated in each week's README on purpose, but
they're worth seeing once in one place:

- **No committed secrets.** `.env` is in `.gitignore`. `.env.example`
  documents every variable.
- **No `package-lock.json` in the repo.** This is a classroom-only
  convention so students always re-resolve dependencies on
  `npm install`. In real projects, commit the lock file.
- **ES Modules everywhere.** Every `package.json` sets `"type":
  "module"`. No CommonJS, no `require`.
- **`async`/`await`.** Promise chains and callback-based control flow
  are not used.
- **No TypeScript, no CSS framework.** Plain JavaScript and modern
  plain CSS (custom properties, Flexbox, Grid, `clamp()`).
- **Passwords are hashed** (bcrypt, cost 12). Plaintext storage is
  never acceptable, even in dev.
- **JWTs live in `HttpOnly` cookies.** Never `localStorage`, never
  `sessionStorage`.
- **The server owns authorization.** `userId` and `role` come from
  the authenticated request, not from `req.body`. Hiding a button in
  React is not security.

## Suggested teaching cadence

- One week of class time per project week.
- Each class: run `docs/weekNN-changes-from-weekMM.md` as the lecture
  outline; students run that week's `README.md` demo commands as a
  lab.
- End of Week 10: walk `docs/security-checklist.md` as the capstone.

## Credits

Written for a classroom audience that already knows some JavaScript
and HTTP but has not yet shipped a real full-stack app.
