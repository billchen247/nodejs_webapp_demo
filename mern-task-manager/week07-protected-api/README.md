# Week 7 — Protected API + Task Ownership

## What this week teaches

> **Can you access this?**

We introduce a reusable `authenticate` middleware, add a `userId` field
to tasks, and require every task endpoint to:

1. Have a valid authenticated user.
2. Query / mutate ONLY tasks that belong to that user.

The server is now the real security boundary.

## What changed from Week 6

### Server
- New middleware `src/middleware/authenticate.js`.
- `Task` model gained a required, indexed `userId`.
- `taskController` scopes every query by `{ _id, userId }`; `createTask`
  sets `userId` from `req.user.id`, **never** from the request body.
- `taskRoutes` mounts `authenticate` for all task endpoints.
- `authController.me` now reuses the shared `authenticate` middleware.
- The server intentionally returns **404** (not 403) for someone else's
  resource, so we don't leak that it exists.

### Client
- `Home.jsx`:
  - If no user, we show a "please sign in" state (no API call).
  - 401 responses redirect the user to the login view.
  - UI reads from `user.name` and labels tasks as *yours*.
- `App.jsx` passes `onRequireLogin` down to `Home`.

### Teaching points unchanged in behavior

- `/api/auth/*` endpoints are unchanged in shape.
- `/api/auth/me` is now implemented using the shared middleware.

## Install

```bash
cd week07-protected-api/server && npm install
cd ../client && npm install
```

## Configure `.env`

Same shape as Week 6. Keep `JWT_SECRET` strong.

## Run

```bash
cd week07-protected-api/server && npm run dev
cd week07-protected-api/client && npm run dev
```

## API endpoints

Auth (unchanged shapes, same URLs):

| Method | Path                   | Status when anonymous |
| ------ | ---------------------- | ---------------------- |
| POST   | `/api/auth/register`   | 201 or 400 |
| POST   | `/api/auth/login`      | 200 or 401 |
| POST   | `/api/auth/logout`     | 200 |
| GET    | `/api/auth/me`         | 401 if not authenticated |

Tasks (now PROTECTED):

| Method | Path              | Status when anonymous | Status when owner | Status for someone else's task |
| ------ | ----------------- | --------------------- | ----------------- | ------------------------------ |
| GET    | `/api/tasks`      | 401                   | 200 (my tasks)    | n/a                            |
| GET    | `/api/tasks/:id`  | 401                   | 200               | 404                            |
| POST   | `/api/tasks`      | 401                   | 201               | n/a                            |
| PUT    | `/api/tasks/:id`  | 401                   | 200               | 404                            |
| DELETE | `/api/tasks/:id`  | 401                   | 200               | 404                            |

### Manual test — alice vs. bob

```bash
# Create Alice
curl -c alice.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"alicealice"}'

# Create a task as Alice
curl -b alice.txt -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Alice secret"}'
#   → remember the "_id" from the response

# Create Bob
curl -c bob.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"bobbobbob"}'

# Bob lists his tasks — empty []
curl -b bob.txt http://localhost:5000/api/tasks

# Bob tries to read Alice's task — 404, not 403
curl -i -b bob.txt http://localhost:5000/api/tasks/<alice-task-id>

# Bob tries to DELETE Alice's task — 404
curl -i -b bob.txt -X DELETE http://localhost:5000/api/tasks/<alice-task-id>

# Alice can still read / update / delete her task
curl -b alice.txt http://localhost:5000/api/tasks/<alice-task-id>
```

### 401 vs. 403 vs. 404

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 401  | Not authenticated. The server doesn't know who you are. |
| 403  | Authenticated, but not authorized to do this.          |
| 404  | Resource not found (or hidden from this user).         |

In Week 7, cross-user access returns **404** to avoid revealing other
users' documents. Week 9 (admin APIs) returns a real **403** for
authenticated-but-non-admin users.

## Important files

```
week07-protected-api/
├── server/src/
│   ├── middleware/authenticate.js       # NEW: shared auth middleware
│   ├── models/Task.js                   # + userId
│   ├── models/User.js
│   ├── controllers/
│   │   ├── taskController.js            # per-user scoped queries
│   │   └── authController.js            # /me reuses authenticate
│   ├── routes/
│   │   ├── taskRoutes.js                # router.use(authenticate)
│   │   └── authRoutes.js
│   ├── config/
│   │   ├── auth.js
│   │   └── database.js
│   └── server.js
└── client/src/
    ├── App.jsx                          # passes onRequireLogin to Home
    ├── pages/Home.jsx                   # anonymous & 401 handling
    └── ...everything else unchanged
```

## Suggested classroom demonstration

1. Register Alice (UI), add two tasks.
2. Open an **incognito window**, register Bob, add one task.
3. In Compass, show the `tasks` collection — each document has `userId`.
4. In Alice's browser, open DevTools → Network, hit refresh. Confirm
   `GET /api/tasks` returns only Alice's tasks.
5. Copy Alice's task `_id`. In Bob's browser DevTools Console:
   ```js
   await fetch("http://localhost:5000/api/tasks/<alice-id>", {
     credentials: "include",
   }).then((r) => r.status);   // 404
   ```
6. Log Alice out → the UI shows "please sign in".
7. Delete Alice's cookie in DevTools → refresh → UI shows "please sign in".

## What students should understand after the lesson

- **Authentication middleware** attaches `req.user` once and for all handlers.
- **Ownership** is enforced in the query itself (`{ _id, userId }`).
- The server **never trusts** `req.body.userId` or `X-User` headers.
- 401 vs. 403 vs. 404 have precise meanings.
- Hiding other users' resources with 404 reduces the information an
  attacker can gather.
- The React UI can politely redirect to login on 401, but the server is
  what actually enforces access.
