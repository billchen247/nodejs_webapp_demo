# Week 7 — Changes from Week 6

## What We Had Before

- Users could register, log in, log out, and read `/api/auth/me`.
- Tasks were still **shared** — any user, anonymous or not, could
  touch any task.
- No reusable authentication middleware.

## What We Added

### Server
- `src/middleware/authenticate.js` — reusable; sets `req.user`.
- `userId` on the `Task` schema (required, indexed, `ref: User`).
- Owner-scoped queries in every task controller.
- `router.use(authenticate)` on the task router.

### Client
- Anonymous "please sign in" state in `Home`.
- 401 handling on every task mutation (redirect to login).
- An `onRequireLogin` prop plumbed from `App` to `Home`.

## What We Changed

- `authController.me` now uses the shared middleware instead of
  decoding the cookie inline.
- `Home.jsx` labels tasks as the user's and reads `user.name`.
- UI headings and page title updated to Week 7.

## Files Added

- `server/src/middleware/authenticate.js`
- `docs/week07-protected-api.md`
- `docs/week07-changes-from-week06.md`

## Files Modified

- `server/src/models/Task.js`
- `server/src/controllers/taskController.js`
- `server/src/controllers/authController.js`
- `server/src/routes/taskRoutes.js`
- `client/src/App.jsx`
- `client/src/pages/Home.jsx` / `Home.css`
- `client/index.html`
- `README.md`

## Files Unchanged

- `server/src/models/User.js`
- `server/src/config/auth.js`
- `server/src/routes/authRoutes.js`
- `client/src/pages/Login.jsx` / `Register.jsx`
- `client/src/components/*` (TaskForm, TaskList, TaskItem, NavBar)

## Dependencies Added

None.

## Architecture Change

```
Week 6                              Week 7
-------                             -------
unauthenticated task API         →  authenticated task API
one global pool of tasks         →  per-user tasks (userId required)
inline cookie decoding in /me    →  shared authenticate middleware
no 401 handling in UI            →  UI reacts to 401 by prompting login
```

## New Concepts

- Authentication middleware (`req.user`).
- Owner-scoped queries.
- Server-controlled fields vs. client-controlled fields.
- 401 vs. 403 vs. 404 semantics.
- Why 404 is a good "stealth" response for cross-user data.
- Routers that apply middleware with `router.use(...)`.

## Why We Made These Changes

Authentication alone (Week 6) didn't actually protect anything. Week 7
makes the tasks collection private per user. This is also the natural
point to introduce reusable middleware, which Weeks 9 and 10 will
build on (role check, rate limiting, request validation).

## Classroom Demonstration

1. **Two browsers**: regular + incognito, or two profiles.
2. Register Alice (left) and Bob (right). Each creates tasks.
3. Compass → `tasks` collection: show two sets of documents, each with
   a different `userId`.
4. In Alice's DevTools → Network, show `GET /api/tasks` returning only
   her tasks.
5. In Bob's DevTools Console, try to fetch Alice's task id → **404**.
6. Discuss why we chose 404 over 403.
7. Log Alice out. The UI returns to "please sign in". Her tasks are
   still safe in MongoDB; the server simply refuses to show them to
   an unauthenticated caller.
