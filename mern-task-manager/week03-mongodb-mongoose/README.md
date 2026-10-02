# Week 3 — MongoDB + Mongoose

## What this week teaches

> **How do we persist data?**

Up to now, our tasks lived in a JavaScript array in Node.js memory. When
we restarted the server, data disappeared. This week we persist data in
**MongoDB** using **Mongoose**, so tasks survive restarts.

## What changed from Week 2

- Added `mongoose` and `dotenv`.
- Added `src/config/database.js` — connects to MongoDB on startup.
- Added `src/models/Task.js` — the Mongoose schema and model.
- Rewrote `src/controllers/taskController.js` to use Mongoose instead of the in-memory array.
- Removed `src/data/tasks.js` — no more in-memory data.
- Server now connects to MongoDB **before** calling `app.listen`.
- Updated `.env.example` with `MONGODB_URI`.

The HTTP surface (routes, methods, status codes) is identical to Week 2 —
only the storage layer changed. This is intentional: students see that a
well-designed REST API doesn't care where its data lives.

## Prerequisites

You need a running MongoDB locally, or a free Atlas cluster.

- **Local**: install MongoDB Community Edition and start `mongod`. Default URI:
  `mongodb://localhost:27017/taskmanager`
- **Atlas**: create a free cluster, create a database user, allow your IP,
  and copy the connection string into `.env`.

Install **MongoDB Compass** (the official GUI) to inspect the database.

## How to install

```bash
cd week03-mongodb-mongoose
npm install
```

## Configure `.env`

```bash
cp .env.example .env
# edit .env, especially MONGODB_URI
```

| Variable       | Default                                     | Purpose |
| -------------- | ------------------------------------------- | ------- |
| `PORT`         | `5000`                                      | Express port. |
| `MONGODB_URI`  | `mongodb://localhost:27017/taskmanager`     | MongoDB connection string. |

## How to run

```bash
npm run dev
# or
npm start
```

Expected output:

```
Connected to MongoDB: taskmanager
Week 3 server listening on http://localhost:5000
```

## API endpoints

Same as Week 2, but now backed by MongoDB:

| Method | Path              | Description                 |
| ------ | ----------------- | --------------------------- |
| GET    | `/api/tasks`      | List all tasks (newest first) |
| GET    | `/api/tasks/:id`  | Fetch one by Mongo id       |
| POST   | `/api/tasks`      | Create a task               |
| PUT    | `/api/tasks/:id`  | Update a task               |
| DELETE | `/api/tasks/:id`  | Delete a task               |

Important: `:id` is now a **MongoDB ObjectId** like `6650f...`, not an integer.

### Try it

```bash
# Create one
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Mongoose","description":"schemas and models"}'

# List
curl http://localhost:5000/api/tasks

# Replace <id> with the real _id from the list
curl -X PUT http://localhost:5000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

curl -X DELETE http://localhost:5000/api/tasks/<id>

# Invalid id → 400
curl -i http://localhost:5000/api/tasks/not-an-objectid

# Validation error → 400
curl -i -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" -d '{}'
```

## Important files

```
week03-mongodb-mongoose/
├── package.json
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── week03-mongodb-mongoose.md
│   └── week03-changes-from-week02.md
└── src/
    ├── server.js
    ├── config/
    │   └── database.js         # connectDatabase()
    ├── models/
    │   └── Task.js             # Mongoose schema + model
    ├── routes/
    │   └── taskRoutes.js
    └── controllers/
        └── taskController.js   # uses Mongoose now
```

## New dependencies

| Package    | Why |
| ---------- | --- |
| `mongoose` | ODM for MongoDB — schemas, models, validation, async query API. |
| `dotenv`   | Loads `.env` into `process.env`. |

## Architecture

```
Client
   |
   v
Express app
   |
   v
taskController   <-- async/await
   |
   v
Mongoose model (Task)
   |
   v
MongoDB
```

## Suggested classroom demonstration

1. Open MongoDB Compass connected to `mongodb://localhost:27017`.
2. `npm run dev` — point out "Connected to MongoDB: taskmanager".
3. Create a task via `curl -X POST`. Switch to Compass, refresh — show the
   new document in the `tasks` collection.
4. Point out: `_id`, `createdAt`, `updatedAt`, `__v`.
5. Restart the server. The task is still there (unlike Week 2).
6. Try `GET /api/tasks/not-an-objectid` — show the 400 response.
7. Try `POST /api/tasks` with empty body — show the Mongoose validation error.

## What students should understand after the lesson

- **Database vs. collection vs. document**: MongoDB stores documents in collections, inside a database.
- A **Mongoose schema** defines the shape and rules of documents.
- A **Mongoose model** gives you query methods (`find`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`).
- All Mongoose calls are **async** — we use `async`/`await`.
- `_id` is an **ObjectId**, not an integer.
- Validation lives in the schema and surfaces as a `ValidationError`.
- The REST surface is unchanged — only the storage layer moved.
