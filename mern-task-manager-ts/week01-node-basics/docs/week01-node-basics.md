# Week 1 — Node.js Basics (Teaching Notes)

## Learning goals

By the end of this week, a student should be able to:

1. Explain what Node.js is in one sentence.
2. Create a new TypeScript project (`package.json`, `tsconfig.json`) from scratch.
3. Start a server with Node's built-in `http` module.
4. Explain the shape of an HTTP request and response.
5. Write a small unit test and a small HTTP test with Vitest.

---

## What is Node.js, really?

Node.js is a program that runs JavaScript (and, through tools like `tsx`,
TypeScript) **outside the browser**. The browser is one JavaScript host; Node
is another. Node adds APIs for things browsers do not need, like reading
files or opening a TCP socket.

The piece we use this week — the `http` module — ships with Node itself.
It knows how to parse HTTP, hand us a `request` object, let us write to a
`response` object, and send it back on the wire. That is the whole trick.

## Why TypeScript from day one?

- The errors TypeScript catches (`task.titel`, missing fields, wrong types)
  are the exact bugs a beginner hits most often.
- Types are documentation. Looking at the `Task` interface tells a new
  reader what a task is without reading any other code.
- Later weeks will have *way* more surface area (Mongoose schemas, React
  props, request bodies). TypeScript will help us stay organised.

We use `tsx` to run TypeScript without a separate build step. In production
we might run `tsc` first and then run the compiled JS, but for a classroom
project the dev loop matters more.

## ES Modules, not CommonJS

This project uses `"type": "module"` and `import`/`export` throughout.
`require(...)` is gone. If a student searches Stack Overflow and finds a
`const express = require("express")` snippet, that is a hint that the answer
is old.

## URL vs path vs route

- **URL:** `http://localhost:3000/api/tasks/1?foo=bar`
- **Pathname:** `/api/tasks/1`
- **Route:** the pattern we match against, like `/api/tasks/:id`.

Node gives us the raw URL. We parse it with the standard `URL` class. Then
we check the method (`GET`, `POST`, ...) and the path, and decide what to do.
Express will take this chore off our hands in Week 2.

## Status codes we use this week

| Code | Meaning                        | When we return it                              |
|------|--------------------------------|------------------------------------------------|
| 200  | OK                             | Successful read                                |
| 400  | Bad Request                    | The id was not a number                        |
| 404  | Not Found                      | No task has that id (or path does not exist)   |
| 405  | Method Not Allowed             | Someone tried to POST / PUT / DELETE this week |

Teaching students the semantics of status codes early is worth the effort —
the HTTP contract is the one thing that stays constant for the rest of the
course.

## Tests, both flavours

- `getAllTasks` and `getTaskById` are **unit tests**. They call a function
  directly and check its return value. Fast and focused.
- The `fetch(baseUrl + '/api/tasks')` tests are **integration tests**. They
  stand up the real server on a random port and talk to it over HTTP. These
  catch bugs that live between modules.

Both have their place. In Week 2 we will add Supertest, which is a slightly
nicer way to write the integration flavour.

## Where we go next

- **Week 2:** Replace the hand-rolled routing with **Express** and add the
  full CRUD surface (`POST`, `PUT`, `DELETE`).
- **Week 3:** Replace the in-memory array with **MongoDB + Mongoose** so
  data survives a restart.
- **Week 4:** Introduce **React**.
- **Week 5:** Wire React to the Express API and ship a full MERN stack.
- **Weeks 6–10:** Add authentication, authorization, and production security.

The code we wrote this week will still be recognisable in Week 10 — tasks
are tasks, routes are routes. Only the layers around them change.
