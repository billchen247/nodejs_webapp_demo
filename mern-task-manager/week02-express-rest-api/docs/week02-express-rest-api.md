# Week 2 — Teaching Notes

## Learning goals

- Students can install and use Express.
- Students can explain what middleware is.
- Students can read a route file and find the matching controller.
- Students can perform all four CRUD operations against a REST API.
- Students can describe why we separate routes from controllers.

## Key concepts

### Framework vs. library

Node's `http` module is a library — you call it. Express is still "just" a
library, but it imposes a pattern (middleware pipeline + routers). Many
Node.js backends follow this shape.

### Middleware

A middleware is a function with the signature `(req, res, next)` (or
`(err, req, res, next)` for error handlers). It can:

- read or modify `req` / `res`
- end the response (`res.send`, `res.json`)
- call `next()` to pass control to the next middleware

Classic examples: body parsers, loggers, authentication (coming in Week 7).

### Router

A `Router` is a mini Express app. We mount it with `app.use("/api/tasks", taskRoutes)`.
Inside the router, paths are relative to the mount point.

### Controllers

Controllers are plain functions. Nothing magical. The split keeps route
files short and makes it easy to add tests later.

### Status codes used

| Code | When                                     |
| ---- | ---------------------------------------- |
| 200  | Successful GET / PUT / DELETE            |
| 201  | Successful POST (new resource created)   |
| 400  | Bad input (missing title)                |
| 404  | Resource not found                       |
| 500  | Something broke on the server            |

### What's still painful

- Data lives in memory. Restart the server and all tasks disappear.
- There is no validation beyond "title must be a string."
- No unique ids beyond our hand-written `nextId()`.

MongoDB and Mongoose solve all of this. Next week.
