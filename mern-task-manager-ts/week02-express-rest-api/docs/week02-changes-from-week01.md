# Week 2 — Changes from Week 1

## What We Had Before

A single Node `http` server (`src/server.ts`) that routed requests by
regex-matching `req.url`. It supported three GET endpoints and nothing else.
Data was an in-memory array in `src/data/tasks.ts`. Tests were a mix of
unit tests and `fetch`-based integration tests.

## What We Added

- Express as a web framework.
- A full REST CRUD surface: `POST`, `PUT`, `DELETE` on `/api/tasks`.
- A dedicated **routes** layer (`src/routes/taskRoutes.ts`) and a
  **controllers** layer (`src/controllers/taskController.ts`).
- An **app factory** (`src/app.ts`) so tests can obtain an Express app
  without starting a server on a port.
- Supertest-based API tests covering every endpoint and every error case.

## What We Changed

- `src/server.ts` is now trivially small: it imports `createApp()` and
  calls `app.listen(port)`. All routing/handler logic moved to `app.ts`
  and the routes/controllers.
- `src/data/tasks.ts` gained `createTask`, `updateTask`, `deleteTask`, and
  input types (`NewTaskInput`, `TaskUpdateInput`). It also owns a
  monotonically increasing `nextId` so clients can never pick their own id.
- `vitest.config.ts` excludes `src/server.ts` from the coverage report
  (its only job is to bind a port).

## Files Added

- `src/app.ts`
- `src/routes/taskRoutes.ts`
- `src/controllers/taskController.ts`
- `tests/taskApi.test.ts`
- `docs/week02-express-rest-api.md`
- `docs/week02-changes-from-week01.md`

## Files Modified

- `package.json` (new deps, updated name/description)
- `src/server.ts` (reduced to a bootstrap)
- `src/data/tasks.ts` (added CRUD helpers + input interfaces)
- `vitest.config.ts` (updated coverage excludes)
- `README.md`
- `.env.example` (unchanged content, re-authored for Week 2)

## Files Removed

- `tests/tasks.test.ts` (replaced by `taskApi.test.ts`)
- `docs/week01-node-basics.md` (each week keeps only its own teaching doc)

## Dependencies Added

- `express` + `@types/express`
- `supertest` + `@types/supertest`

## Architecture Change

```
Week 1:                           Week 2:
                                   
http.createServer(handler)         Express app
   ↓                                  ↓
regex match on req.url             app.use("/api/tasks", router)
   ↓                                  ↓
tasks.ts (R only)                  controller → tasks.ts (CRUD)
```

## Testing Changes

- Added Supertest to drive API tests directly against the Express app
  without opening a port.
- Expanded coverage to all five endpoints and every error branch
  (400 invalid id, 404 missing, 400 missing title, …).

## CSS/UI Changes

None — there is still no UI this week.

## New TypeScript Concepts

- `Request` and `Response` types from `@types/express`.
- Narrow DTO types (`NewTaskInput`, `TaskUpdateInput`) that model
  "the subset of fields the client is allowed to send".

## New Concepts

- Middleware (`express.json()`, 404 fallback, error-handling middleware).
- Routers (`express.Router()`) as a way to group routes by resource.
- Status codes for mutation outcomes (201, 204).
- Testing with Supertest.
- Dropping unknown fields instead of trusting the client's body shape.

## Why We Made These Changes

Routing by hand with regex was a great way to understand `http`, but it
is already painful with five endpoints and will be unbearable with
twenty. Express is the smallest framework that solves this cleanly, and
it is the universal default for Node APIs.

Splitting into `routes` and `controllers` *before* we add Mongoose means
that the storage swap in Week 3 only touches the data layer — the
Express layer and the tests barely move.

## Classroom Demonstration

1. Diff `src/server.ts` between Week 1 and Week 2. "Look how small it got."
2. Walk through `src/app.ts` and highlight the three middleware kinds:
   body-parser (`express.json()`), 404 catch-all, error handler.
3. Walk through one controller function and ask: *where does the HTTP
   status code come from?*
4. Walk through one Supertest test and compare it to the Week 1 `fetch`
   test. Note that Supertest does not need the server to be running.
5. Run `npm run test:coverage` and discuss which lines are red.
