# Week 2 — Express REST API

## What this week teaches

> **How do we build an API?**

Last week we hand-wrote routing with regular expressions and had to call
`writeHead` / `end` / `JSON.stringify` for every response. This week we
introduce **Express** — the most popular Node.js framework — and get
clean routing, middleware, body parsing, and real CRUD.

## What changed from Week 1

- Added `express` as a dependency.
- Replaced the hand-rolled `http.createServer` with `express()`.
- Split request handling into **routes** (`src/routes/`) and **controllers** (`src/controllers/`).
- Added **POST**, **PUT**, and **DELETE** endpoints — real CRUD.
- Added JSON body parsing middleware (`express.json()`).
- Added a simple request logger (middleware demo).
- Added a central 404 handler and error handler.

The in-memory data array is still here — persistence comes in Week 3.

## How to install

```bash
cd week02-express-rest-api
npm install
```

(Reminder: `package-lock.json` is intentionally gitignored for this course.
If `npm install` creates one, don't commit it.)

## Configure `.env`

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT`   | `5000`  | Port Express listens on. |

## How to run

```bash
npm run dev     # restarts on changes
# or
npm start
```

```
Week 2 server listening on http://localhost:5000
```

## API endpoints

| Method | Path              | Description                     |
| ------ | ----------------- | ------------------------------- |
| GET    | `/`               | Welcome message                 |
| GET    | `/api/tasks`      | List all tasks                  |
| GET    | `/api/tasks/:id`  | Fetch one task                  |
| POST   | `/api/tasks`      | Create a task                   |
| PUT    | `/api/tasks/:id`  | Update a task                   |
| DELETE | `/api/tasks/:id`  | Delete a task                   |

### Try it with curl

```bash
# list
curl http://localhost:5000/api/tasks

# get one
curl http://localhost:5000/api/tasks/1

# create
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express","description":"routes + controllers"}'

# update
curl -X PUT http://localhost:5000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# delete
curl -X DELETE http://localhost:5000/api/tasks/1
```

## Important files

```
week02-express-rest-api/
├── package.json
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── week02-express-rest-api.md
│   └── week02-changes-from-week01.md
└── src/
    ├── server.js                    # Express app + middleware
    ├── routes/
    │   └── taskRoutes.js            # URL -> controller
    ├── controllers/
    │   └── taskController.js        # handlers
    └── data/
        └── tasks.js                 # in-memory array
```

## New dependencies

| Package  | Why |
| -------- | --- |
| `express` | HTTP framework: routing, middleware, body parsing. |

## Architecture

```
Client
   |
   v
Express app (server.js)
   |---> express.json()          <- middleware
   |---> request logger          <- middleware
   |---> /api/tasks router
   |         |
   |         v
   |     taskController
   |         |
   |         v
   |     in-memory tasks[]
   |
   |---> 404 handler
   |---> error handler
```

## Suggested classroom demonstration

1. Compare `week01-node-basics/src/server.js` with `week02-express-rest-api/src/server.js` side by side. Point out: no more regex URL parsing, no more `writeHead`.
2. Explain what middleware is by walking through `express.json()` and the logger.
3. Create a task via `curl -X POST`, show that `GET /api/tasks` now returns it.
4. Delete the task, show that `GET /api/tasks/:id` returns 404.
5. Restart the server — show that all data is gone (motivates Week 3).

## What students should understand after the lesson

- Express is middleware-driven: each request flows through a stack of functions.
- `app.use`, `router.get`, `router.post` etc. attach handlers.
- `req.params`, `req.body`, `req.query` give you input.
- `res.status(code).json(data)` is the normal response pattern.
- Separating **routes** and **controllers** keeps code easy to navigate.
- CRUD = Create / Read / Update / Delete, mapped to POST / GET / PUT / DELETE.
- In-memory data is fragile — it disappears on restart.
