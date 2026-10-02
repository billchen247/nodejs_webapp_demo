# Week 3 — Teaching Notes

## Learning goals

- Students can describe MongoDB in one sentence.
- Students can create a Mongoose schema and model.
- Students can read and write documents using `async`/`await`.
- Students can tell the difference between a validation error (400) and a not-found (404).
- Students can inspect collections and documents in Compass.

## Mental model

```
JavaScript object
       ↓            Mongoose model
MongoDB document    (schema + methods)
       ↓
collection "tasks"
       ↓
database "taskmanager"
```

## Core concepts

### MongoDB

A **document database**. Instead of rows in tables, you store JSON-like
documents in collections. A document has a built-in `_id`.

### Mongoose

An **ODM** (Object-Document Mapper) for MongoDB in Node.js. It gives us:

- **Schemas** — field types + validation.
- **Models** — query methods bound to a collection.
- **Middleware/hooks** — not used this week.
- Automatic conversion between JavaScript objects and MongoDB BSON.

### Schema features used

- `type: String`, `type: Boolean`
- `required`
- `trim`
- `maxlength`
- `default`
- `timestamps: true` → adds `createdAt` and `updatedAt`

### Common Mongoose methods

| Method                           | Does                                     |
| -------------------------------- | ---------------------------------------- |
| `Task.find()`                    | List all documents.                      |
| `Task.findById(id)`              | Fetch one by `_id`.                      |
| `Task.create(data)`              | Build + validate + save in one step.     |
| `Task.findByIdAndUpdate(id,...)` | Patch and (optionally) return new doc.   |
| `Task.findByIdAndDelete(id)`     | Remove a document.                       |

### Status code strategy

| Scenario                       | Response |
| ------------------------------ | -------- |
| OK                             | 200 / 201 |
| Invalid ObjectId format        | 400 (manual check) |
| Validation error from Mongoose | 400 (`err.name === "ValidationError"`) |
| Document not found             | 404 |
| Unknown error                  | 500 (passed to `next(err)`) |

### Environment variables

We now have **secrets-adjacent** config (the database URI). We load it
with `dotenv` from a local `.env` file that is **not** committed. The
`.env.example` records which variables exist, without their values.

## Common student questions

**Where did `_id` come from?**
MongoDB assigns an ObjectId automatically on insert.

**Why does `GET /api/tasks/abc` return 400 instead of 404?**
`abc` is not a valid ObjectId — the request is malformed, not a lookup miss.

**What is `__v`?**
Mongoose's internal version key. Safe to ignore for now.

**Does Mongoose create the database?**
Not quite. MongoDB auto-creates the database and collection on the first
write. If you never POST, Compass may show nothing.
