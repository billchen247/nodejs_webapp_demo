# Week 3 — Changes from Week 2

## What We Had Before

An Express REST API backed by an in-memory JavaScript array
(`src/data/tasks.ts`). Full CRUD, Supertest-driven tests, no persistence.

## What We Added

- **MongoDB** as the data store.
- **Mongoose** schema + model (`src/models/Task.ts`).
- A **database config module** (`src/config/database.ts`) that owns the
  Mongoose connection.
- A `.env`-based `MONGODB_URI` and the `dotenv` loader in `server.ts`.
- An **in-memory MongoDB** test fixture (`tests/setup.ts` + the
  `mongodb-memory-server` dev dependency).
- A **model-level test suite** (`tests/taskModel.test.ts`) that exercises
  schema validation, defaults, timestamps, and the JSON transform.
- Timestamps (`createdAt`, `updatedAt`) on every task.
- A friendlier JSON payload: `id` instead of `_id`, no `__v`.

## What We Changed

- `src/controllers/taskController.ts` now `await`s Mongoose instead of
  calling a sync array helper. Validation errors become 400s with per-field
  messages; everything else bubbles through to the error-handling middleware.
- `src/server.ts` is now `async main()` — it connects to Mongo *before*
  binding the port.
- `tests/taskApi.test.ts` no longer imports a `_resetTasksForTests` helper;
  the Vitest setup file wipes the collection between tests.
- IDs are MongoDB ObjectId strings (24 hex chars) instead of integers. The
  controller validates them with `mongoose.isValidObjectId` before hitting
  the database.

## Files Added

- `src/config/database.ts`
- `src/models/Task.ts`
- `tests/setup.ts`
- `tests/taskModel.test.ts`
- `docs/week03-mongodb-mongoose.md`
- `docs/week03-changes-from-week02.md`

## Files Removed

- `src/data/tasks.ts` (replaced by the Mongoose model)
- `docs/week02-*.md`

## Files Modified

- `package.json` — new deps, updated name.
- `src/server.ts` — now connects to Mongo on startup.
- `src/app.ts` — welcome message updated.
- `src/controllers/taskController.ts` — Mongoose-backed, with id validation
  and a validation-error branch.
- `src/routes/taskRoutes.ts` — unchanged except for its author header.
- `vitest.config.ts` — now registers the setup file and raises timeouts.
- `.env.example` — adds `MONGODB_URI`.
- `README.md`

## Dependencies Added

- `mongoose`
- `dotenv`
- `mongodb-memory-server` (dev)

## Architecture Change

```
Week 2:                             Week 3:

Express → controllers →             Express → controllers →
          in-memory array                     Mongoose model → MongoDB
                                              ↑
                                              │
                                     src/models/Task.ts
                                     src/config/database.ts
```

## Testing Changes

- Introduced the "setup file" pattern: Vitest spins up an in-memory
  MongoDB once, Mongoose connects to it, and each test gets a clean
  collection.
- Added `tests/taskModel.test.ts` to teach that *the model itself* is a
  valuable thing to unit-test — not everything has to go through Express.
- Expanded `tests/taskApi.test.ts` to cover ObjectId validation and
  validator-on-update behavior.

## CSS/UI Changes

None. The UI arrives in Week 4.

## New TypeScript Concepts

- `InferSchemaType<typeof schema>` as a way to derive a TypeScript type
  from a Mongoose schema. Prevents interface/schema drift.
- `HydratedDocument<Attrs>` as the type of a saved Mongoose document.

## New Concepts

- Documents, collections, databases (MongoDB vocabulary).
- Schemas vs models vs documents (Mongoose vocabulary).
- `strictQuery`, `runValidators`, `timestamps`, `toJSON.transform` as
  tiny but important Mongoose knobs.
- Why we never share a database between dev and tests.
- `ObjectId` validation at the controller boundary.

## Why We Made These Changes

The API we built in Week 2 was fun but useless the moment the Node
process restarted. Persistence is non-negotiable for any real app, and
MongoDB is a natural first database because its document model lines up
closely with how we already think about JavaScript objects.

Mongoose is specifically useful for teaching: students see
"schema → model → document" and have an organising principle they can
carry into any ODM/ORM.

## Classroom Demonstration

1. Run the Week 2 server, create a task, kill the server, restart. The
   task is gone. Point at `src/data/tasks.ts` — "the array lives in the
   process".
2. Open Week 3's `src/models/Task.ts`. Walk through the schema.
3. Run Week 3, create a task, kill the server, restart, GET the task.
   It survived.
4. Open MongoDB Compass and show the collection and the actual document.
5. Run `npm run test`. Open `tests/setup.ts` and talk about *why* an
   in-memory DB.
6. Deliberately break the schema (set `completed: "yes"`) in a quick ad-hoc
   POST and show the 400 response Mongoose produces.
