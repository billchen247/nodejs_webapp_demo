# todo-mongo-api-express

**The same tiny Todo REST API as the four sibling projects — now backed by MongoDB.**

Built with:

| Concern              | Choice                            | Why |
| -------------------- | --------------------------------- | --- |
| Runtime              | Node.js ≥ 24, ESM                 | Native `import`, no transpiler at runtime |
| Language             | TypeScript 5 (strict)             | Types on request/response boundaries |
| HTTP framework       | **Express 5**                     | Async errors auto-forward, real router |
| Database             | **MongoDB**                       | The 'M' in MERN |
| ODM                  | **Mongoose 8**                    | Schema + validation + typed models |
| Validation           | Zod 3                             | One declaration → runtime check + TS type |
| Security             | Helmet + CORS + rate-limit        | Sensible defaults out of the box |
| Ops                  | morgan + compression              | Request logs + gzip |
| Docs                 | swagger-ui-express + OpenAPI 3    | Interactive docs at `/api-docs` |
| Tests                | Vitest + supertest + `mongodb-memory-server` | Real Mongo semantics, no external service |

---

## Why this project exists

The four sibling projects (`todo-node-api`, `todo-connect-api`, `todo-express-api`, `todo-node-api-express`) hold everything constant *except the HTTP framework layer* to show what a framework actually buys you. **This project holds the framework constant and swaps the JSON-file store for a real database** — so you can see the analogous story from the other side: what a database + ODM buys you over hand-rolled persistence.

Diffing `todo-node-api-express/src/models/todos.ts` against `todo-mongo-api-express/src/models/todos.ts` is the most concise answer to "why do people use Mongoose".

---

## Quick start

```bash
# 1. Point at a MongoDB instance. Any of these work:
#      * local mongod:  brew services start mongodb-community  (macOS)
#      * Docker:        docker run -d -p 27017:27017 --name mongo mongo:7
#      * Atlas:         copy the SRV connection string from the UI
cp .env.example .env
# ...edit MONGODB_URI in .env if you need to.

# 2. Install & run
npm install
npm run dev            # tsx watch, hot reload
# or
npm run build && npm start
```

Then open:

* **Home page:**   http://localhost:3003/
* **REST root:**   http://localhost:3003/api/todos
* **Swagger UI:**  http://localhost:3003/api-docs/
* **Raw OpenAPI:** http://localhost:3003/api-docs/swagger.json

The four sibling projects default to ports 3000 / 3001 / 3002, so all five can run at once.

---

## Endpoints

| Method | Path                | Description                                                     |
| ------ | ------------------- | --------------------------------------------------------------- |
| GET    | `/api/todos`        | List todos. `?completed=true|false`, `?limit=N`, `?skip=N`      |
| POST   | `/api/todos`        | Create a todo. Body: `{ "title": "..." }`                       |
| GET    | `/api/todos/:id`    | Fetch one by ObjectId                                           |
| PUT    | `/api/todos/:id`    | Update fields (`title`, `completed`)                            |
| DELETE | `/api/todos/:id`    | Delete a todo                                                   |

### Todo document shape

```json
{
  "id": "665f1f77bcf86cd799439011",
  "title": "Learn Mongoose",
  "completed": false,
  "createdAt": "2026-09-23T12:00:00.000Z",
  "updatedAt": "2026-09-23T12:00:00.000Z"
}
```

### Curl examples

```bash
# Create
curl -X POST http://localhost:3003/api/todos \
     -H 'Content-Type: application/json' \
     -d '{"title":"Learn Mongoose"}'

# List completed ones
curl 'http://localhost:3003/api/todos?completed=true'

# Update
curl -X PUT http://localhost:3003/api/todos/665f1f77bcf86cd799439011 \
     -H 'Content-Type: application/json' \
     -d '{"completed":true}'

# Delete
curl -X DELETE http://localhost:3003/api/todos/665f1f77bcf86cd799439011
```

---

## Layout

```
todo-mongo-api-express/
├── src/
│   ├── server.ts               ← entry point: connect Mongo, listen, shutdown
│   ├── app.ts                  ← Express middleware wiring + routes
│   ├── config.ts               ← env vars in one place (dotenv-loaded)
│   ├── db.ts                   ← Mongoose connect / disconnect
│   ├── openapi.ts              ← OpenAPI 3.0 spec (served by Swagger UI)
│   ├── routes/todos.ts         ← the /api/todos router table
│   ├── controllers/
│   │   ├── home.ts             ← GET /
│   │   └── todos.ts            ← CRUD handlers
│   ├── middleware/
│   │   ├── errors.ts           ← notFound + errorHandler (Zod + Mongoose aware)
│   │   ├── swagger.ts          ← mounts swagger-ui-express
│   │   └── validate.ts         ← Zod-schema-to-middleware factory
│   ├── models/todos.ts         ← Mongoose schema + Model + toJSON transform
│   ├── schemas/todos.ts        ← Zod request schemas (+ inferred TS types)
│   └── utils/http-error.ts     ← HttpError class + badRequest / notFound
├── views/home.html             ← static landing page
├── test/server.test.ts         ← Vitest + supertest + mongodb-memory-server
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Testing

```bash
npm test                # one-shot
npm run test:watch      # watch mode
npm run test:coverage   # + coverage report
```

The suite starts an in-process MongoDB via `mongodb-memory-server` — no need to run `mongod` locally. The first run downloads the Mongo binary (cached under `~/.cache/mongodb-binary/`).

---

## What Mongoose buys you vs the JSON-file sibling

Compared to `../todo-node-api-express/src/models/todos.ts`:

- **Server-side filtering & indexing** — `TodoModel.find({ completed: true })` doesn't load the whole collection into memory.
- **Schema validation** — `required`, `trim`, `minlength` run *before* the write and turn into 400s automatically.
- **Timestamps** — `createdAt` and `updatedAt` are managed for you.
- **Typed queries** — `InferSchemaType<typeof schema>` keeps the TS types in lockstep with the schema.
- **id → ObjectId** — the API surface still says `id`, but the underlying store uses Mongo's 96-bit `ObjectId`. The `toJSON` transform in `models/todos.ts` bridges the two.

---

## The other four projects

| Project                        | Framework                               | Store         |
| ------------------------------ | --------------------------------------- | ------------- |
| `../todo-node-api`             | raw `http` module                       | JSON file     |
| `../todo-connect-api`          | Connect (Express's minimalist ancestor) | JSON file     |
| `../todo-express-api`          | Express 4                               | JSON file     |
| `../todo-node-api-express`     | Express 5 + TypeScript + ESM            | JSON file     |
| **this one**                   | Express 5 + TypeScript + ESM            | **MongoDB**   |

Reading 1 → 4 answers *"why do people use Express?"*. Reading 4 → 5 answers *"why do people use Mongoose/MongoDB?"*.

---

## License

MIT — see the repo-level [`LICENSE`](../LICENSE).
