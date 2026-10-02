# Week 2 — Changes from Week 1

## What We Had Before

- A plain Node.js project with no dependencies.
- A single `src/server.js` using the built-in `http` module.
- Hand-rolled URL routing with a regex for `/api/tasks/:id`.
- Three **read-only** endpoints: welcome, list tasks, get task by id.
- An in-memory `tasks` array.

## What We Added

- The `express` dependency.
- `express.json()` body parsing middleware.
- A tiny request logger middleware (demonstrates `(req, res, next)`).
- A `Router` for `/api/tasks`.
- Dedicated `src/controllers/taskController.js` for request handlers.
- A `nextId()` helper so we can assign ids for new tasks.
- A central 404 handler and error handler.
- Full **CRUD**: POST, PUT, DELETE in addition to GET.

## What We Changed

- `src/server.js` is now an Express app, not a raw `http.createServer`.
- Routing is declared, not hand-parsed with regex.
- Responses use `res.status(code).json(...)` instead of `res.writeHead` + `res.end(JSON.stringify(...))`.
- Error handling now goes through Express's error middleware.

## Files Added

- `src/routes/taskRoutes.js`
- `src/controllers/taskController.js`
- `docs/week02-express-rest-api.md`
- `docs/week02-changes-from-week01.md`

## Files Modified

- `package.json` — added `express`, updated name/description.
- `src/server.js` — rewritten using Express.
- `src/data/tasks.js` — added `nextId()` helper; initial data edited.
- `README.md` — updated for Week 2.

## Dependencies Added

- `express` ^4.19.2

## Architecture Change

```
Week 1                               Week 2
-------                              -------
http.createServer                 →  express()
regex URL matching                →  router.get("/:id", ...)
JSON.stringify + writeHead        →  res.json(...)
one file                          →  server + routes + controllers
GET only                          →  full CRUD
```

## New Concepts

- Frameworks vs. libraries.
- Middleware pipeline (`req` → mw → mw → handler → `res`).
- Routers and mount points.
- Body parsing (`express.json()`).
- `req.params`, `req.body`.

## Why We Made These Changes

Hand-written HTTP servers do not scale. Even implementing POST would require
us to buffer the request stream and parse JSON manually. Express gives us
an idiomatic, well-known structure — the one students will see in the real
world — with very little code.

## Classroom Demonstration

1. **Side-by-side comparison.** Open `week01-node-basics/src/server.js` and
   `week02-express-rest-api/src/server.js` in two editor panes. Watch the
   regex go away.
2. **Create a task** with `curl -X POST`.
3. **List** tasks. Point out that the new task has an auto-assigned `id`.
4. **Update** it with PUT. Show that only the fields you send are changed.
5. **Delete** it, then GET it — show the 404.
6. **Restart** the server with Ctrl-C and `npm run dev` again — all data is
   gone. This is the motivation for Week 3 (MongoDB).
