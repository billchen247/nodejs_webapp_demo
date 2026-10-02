# Week 2 — Express REST API (Teaching Notes)

## Learning goals

By the end of this week, a student should be able to:

1. Explain what Express adds on top of the raw `http` module.
2. Define a REST route and map it to a controller function.
3. Explain the difference between 200, 201, 204, 400, and 404.
4. Validate a request body before using it.
5. Write a Supertest test for an API endpoint.

## What Express gives us

Express is just a set of helpers on top of `http.createServer`. Specifically:

- **Routing.** `app.get("/api/tasks/:id", ...)` replaces the regex we wrote
  by hand in Week 1. The `:id` becomes `req.params.id` automatically.
- **Middleware.** Functions with the signature `(req, res, next)` that run
  in order. We use `express.json()` to parse the request body, and we
  define our own 404 and error-handling middleware at the bottom of
  `src/app.ts`.
- **Response helpers.** `res.status(201).json(task)` is one line instead of
  three (`statusCode`, `setHeader`, `end(JSON.stringify(...))`).

## REST, briefly

| Verb    | Intent                               | Our endpoint             | Success |
|---------|--------------------------------------|--------------------------|---------|
| GET     | Read a collection                    | `/api/tasks`             | 200     |
| GET     | Read one item                        | `/api/tasks/:id`         | 200     |
| POST    | Create a new item in the collection  | `/api/tasks`             | **201** |
| PUT     | Update an existing item              | `/api/tasks/:id`         | 200     |
| DELETE  | Remove an item                       | `/api/tasks/:id`         | **204** |

The intuition students need: **the verb says the intent, the path says the
resource, the status code says the outcome**.

## Why we separate routes and controllers

Right now there is only one resource (tasks) and one storage (an array), so
the split looks like extra files. In Weeks 3–9 we are going to add:

- a MongoDB-backed data layer,
- an auth router,
- a users router,
- authentication middleware,
- authorization middleware.

By the time all of that is in place, having each file do one thing will
feel obvious. Introducing the convention this week gets the muscle memory
started.

## Validation at the boundary

The controller rejects a `POST /api/tasks` with no title. That is a tiny
example of a huge rule:

> **Never trust what the client sends you.**

In Week 3 Mongoose will enforce stronger validation at the schema level.
In Week 7 we will introduce authentication middleware that enforces who is
allowed to call the endpoint at all. All of these are different layers of
the same rule.

## Supertest in one sentence

Supertest lets you make an HTTP-shaped request against an Express app
directly, without binding a port. That is why `createApp()` returns an
`Express` instance: tests take that instance, run `request(app).post(...)`,
and get a response object they can assert on.

## What we did NOT change from Week 1

- The `Task` interface still has `id`, `title`, `description`, `completed`.
- Data is still an in-memory JavaScript array that resets on restart.
- `.gitignore`, `tsconfig.json`, and the `tsx` dev loop are unchanged.
- The `/` route still exists and still returns a friendly welcome payload.

Snapshotting the whole project every week is what makes this easy to see
at a glance.

## Where we go next

- **Week 3:** keep the controllers, keep the routes, replace `src/data/tasks.ts`
  with a Mongoose model backed by MongoDB. The tests will become
  database-aware.
