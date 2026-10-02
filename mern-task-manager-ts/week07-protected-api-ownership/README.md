# Week 7 — Protected API + Ownership

> **Question of the week:** *How does the server know which tasks are yours?*

Week 6 taught the server who you are. Week 7 teaches it who **owns**
each piece of data. Every task now carries a `userId`. The task API
requires authentication, and every query is scoped to the current user.

The React UI needs no code changes — it already carries the auth cookie.
Logging in to a different account now shows a different list of tasks.

---

## What this week teaches

- Writing a `requireAuth` middleware that attaches `req.userId`.
- Augmenting the Express `Request` type so TypeScript knows about it.
- Scoping Mongoose queries by owner, in **both** the filter *and* on
  write (so a user cannot update or delete someone else's row by id).
- The 404-vs-403 debate for "you tried to touch something that is not
  yours". We pick 404 and explain why.
- Pinning `userId` server-side on `create`, ignoring any value the
  client might send.
- Hiding `userId` from the response (small info-disclosure hygiene).

---

## Modified / new files

Server:

- `server/src/auth/requireAuth.ts` — new middleware + `Request.userId`
  module augmentation.
- `server/src/models/Task.ts` — `userId` field (required, indexed) and
  compound index on `(userId, createdAt desc)`.
- `server/src/controllers/taskController.ts` — every query scoped by
  `userId`. 404 for cross-user attempts.
- `server/src/routes/taskRoutes.ts` — `router.use(requireAuth)` at the top.
- `server/tests/taskApi.test.ts` — rewritten. Covers 401, ownership
  isolation, spoofed-userId rejection, and the usual CRUD.
- `server/tests/taskModel.test.ts` — tests for the new `userId` rule.

Client: no changes beyond a subtitle tweak.

---

## Installation

```bash
cd week07-protected-api-ownership
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env and set JWT_SECRET
```

## Running

```bash
npm run dev:server
npm run dev:client
```

Open http://localhost:5173. Register one user, add some tasks, log out,
register a second user, add tasks — the two lists are independent.

## Testing

```bash
npm run test:server   # 38 tests
npm run test:client   # 34 tests
```

Interesting new test cases in `server/tests/taskApi.test.ts`:

- `GET /api/tasks returns 401 without a cookie`
- `one user's list does not include another user's tasks`
- `reading someone else's task returns 404, not 403`
- `the server pins userId to the caller even if the body contains a different one`

---

## Suggested classroom demonstration

1. Call `curl http://localhost:3000/api/tasks`. 401.
2. Log in as user A in a browser; copy the cookie value into `curl`:
   now the call succeeds.
3. Register a user B in another browser. Show that B's list is empty
   even though A has created tasks.
4. In DevTools, mutate a task's id to point at a task owned by the
   other user. Click the delete button. Response: 404.

---

## What students should understand after this lesson

- Authentication proves identity. **Authorization** scopes what that
  identity can do. They are different layers; both are required.
- Combining the two with Mongoose is just a filter: every read and
  write uses `{ _id: id, userId: req.userId }`.
- Returning 404 for "not yours" is the kinder default than 403 — same
  information to the real user, less information to an attacker.
- `req.userId` is one line of middleware; every controller that cares
  about ownership becomes trivial after that.
