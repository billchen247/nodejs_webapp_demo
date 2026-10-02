# Week 3 — MongoDB + Mongoose (Teaching Notes)

## Learning goals

By the end of this week, a student should be able to:

1. Explain what a document database is in one sentence.
2. Define a Mongoose schema with required fields and defaults.
3. Explain the difference between a Mongoose **model**, **schema**, and
   **document**.
4. Perform CRUD operations with `Task.find / findById / create / findByIdAndUpdate / findByIdAndDelete`.
5. Write Mongoose model tests against an in-memory database.

## The three layers in one picture

```
  TypeScript interface      Mongoose schema         MongoDB document
  (compile-time contract)   (runtime validator)     (on-disk JSON)

   TaskAttrs      ---->       taskSchema      ---->      { _id, title, ... }
   (inferred)                (source of truth)
```

The interface lives in your editor, the schema lives in Node memory, the
document lives on disk. All three describe the same shape. We never
hand-write the interface — `InferSchemaType` derives it from the schema,
so the two cannot drift.

## Mongoose patterns we use

- **`required: [true, "msg"]`** — gives the validation error a human-readable message.
- **`trim: true`** — strips surrounding whitespace at save time.
- **`timestamps: true`** — adds `createdAt` and `updatedAt` automatically.
- **`toJSON.transform`** — rename `_id` to `id` and drop `__v` when the
  document is serialised. Frontends like a clean payload.
- **`strictQuery: true`** — unknown filter fields throw instead of silently
  matching nothing. Great for catching typos.
- **`runValidators: true`** on `findByIdAndUpdate` — otherwise schema
  validators do NOT run on updates. This is a classic Mongoose gotcha
  worth calling out explicitly.

## Why an in-memory MongoDB for tests?

- **Isolation.** No chance of a test deleting or corrupting the student's
  dev data.
- **Speed.** The whole suite runs in a few seconds.
- **Portability.** The CI machine does not need MongoDB installed.
- **Determinism.** Every test starts from an empty `tasks` collection.

The downside is a one-time binary download on first run. That is why the
Vitest config bumps the hook timeout — the first `npm run test` can take
up to a minute while `mongodb-memory-server` downloads MongoDB.

## New error vocabulary

| Scenario                                 | Status | Why                                     |
|------------------------------------------|--------|-----------------------------------------|
| `GET /api/tasks/not-valid`               | 400    | Not a valid ObjectId                    |
| `GET /api/tasks/<valid id, missing>`     | 404    | Shape is fine but no such document      |
| `POST /api/tasks` with `title: ""`       | 400    | Mongoose validation failure             |
| `PUT /api/tasks/<id>` with `title: ""`   | 400    | Same, thanks to `runValidators: true`   |

Students should be able to predict which status code will come back for
each of these without looking at the controller.

## What did NOT change from Week 2

- The route table (`GET/POST/PUT/DELETE /api/tasks[:id]`).
- The controller/route separation.
- The welcome `/` endpoint.
- The way we test with Supertest.
- The TypeScript configuration.

Snapshotting makes this concrete. Open Week 2 and Week 3 side-by-side; the
file list barely changed, and the controllers *look* almost identical.

## Where we go next

- **Week 4:** React enters the picture. We will build the UI in
  `client/` with mock data — no backend wiring yet.
- **Week 5:** connect the React UI to the Express API from this week.
