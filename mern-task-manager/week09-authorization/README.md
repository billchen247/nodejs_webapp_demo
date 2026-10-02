# Week 9 — Authorization

## What this week teaches

> **What are you allowed to do?**

Authentication tells us *who* a user is. Authorization decides *what*
they may do. We add a `role` field to the `User` model, a reusable
`requireRole` middleware, and an admin-only `/api/users` API. On the
client, we add an `AdminRoute` guard, an Admin page, and a Forbidden
page.

> **Hiding a nav link is NOT authorization.** The server from this week
> onward refuses to serve admin data to non-admin users regardless of
> what the UI shows.

## What changed from Week 8

### Server
- `User.role`: `"user" | "admin"`, default `"user"`.
- `role` is **never** read from the request body — the server sets it.
- New `requireRole(...roles)` middleware.
- New admin-only `userController` + `userRoutes` mounted at `/api/users`.
- `authenticate` now attaches `req.user.role`.
- New dev script `scripts/makeAdmin.js` and `npm run make-admin -- email`.

### Client
- `AdminRoute` wrapper — checks `user.role === "admin"`.
- `Admin` page — lists users via `/api/users`.
- `Forbidden` page — the destination when `AdminRoute` denies.
- `NavBar` now shows an "Admin" link + a tiny role badge for admins.
- New `userService.js` for `/api/users`.

## Install

```bash
cd week09-authorization/server && npm install
cd ../client && npm install
```

## Configure `.env`

Same shape as earlier. Keep `JWT_SECRET` strong.

## Run

```bash
cd week09-authorization/server && npm run dev
cd week09-authorization/client && npm run dev
```

## Make an admin

New registrations always default to `role: "user"`. To create an admin
for class demos, use the development script:

```bash
cd week09-authorization/server
# Register alice@example.com in the UI first (any password works).
npm run make-admin -- alice@example.com
#   → "Promoted alice@example.com to admin"
```

Alice must then log out and log back in (or hit `/api/auth/me`) so the
UI picks up the new role.

> **Why isn't there an API endpoint for this?** Because any API that
> changes a user's role is extremely sensitive. In a real product it
> would be guarded by another admin, audit-logged, and often behind
> MFA. A console script keeps the lesson honest.

## API endpoints

| Method | Path                  | Who can call it                     | Status for wrong role |
| ------ | --------------------- | ----------------------------------- | --------------------- |
| GET    | `/api/users`          | admin                               | 403                   |
| GET    | `/api/users/:id`      | admin                               | 403                   |
| ...    | `/api/tasks`          | any authenticated (per-user scoped) | 401 if anonymous      |
| ...    | `/api/auth/*`         | public (register / login) + authenticated (me / logout) | 401 for /me if anonymous |

### Verify from the terminal

```bash
# Register a regular user
curl -c alice.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"alicealice"}'

# Anonymous → 401
curl -i http://localhost:5000/api/users

# Alice (user role) → 403
curl -i -b alice.txt http://localhost:5000/api/users

# Promote Alice (in the server/ directory)
npm run make-admin -- alice@example.com

# Alice must relogin to get a fresh user shape in /me
curl -b alice.txt -c alice.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alicealice"}'

# Alice (now admin) → 200
curl -b alice.txt http://localhost:5000/api/users
```

## Important files

```
week09-authorization/
├── server/
│   ├── package.json                   # + make-admin script
│   ├── scripts/
│   │   └── makeAdmin.js               # NEW dev-only helper
│   └── src/
│       ├── middleware/
│       │   ├── authenticate.js        # now reads role
│       │   └── requireRole.js         # NEW
│       ├── models/User.js             # + role, + ROLES
│       ├── controllers/
│       │   ├── userController.js      # NEW (admin only)
│       │   ├── authController.js      # role defaulted server-side
│       │   └── taskController.js
│       └── routes/
│           ├── userRoutes.js          # NEW
│           ├── authRoutes.js
│           └── taskRoutes.js
└── client/src/
    ├── App.jsx                        # + /admin, /forbidden
    ├── components/
    │   ├── NavBar.jsx                 # + Admin link + badge
    │   └── routes/
    │       ├── ProtectedRoute.jsx
    │       └── AdminRoute.jsx         # NEW
    ├── pages/
    │   ├── Admin.jsx                  # NEW
    │   ├── Admin.css                  # NEW
    │   ├── Forbidden.jsx              # NEW
    │   ├── Forbidden.css              # NEW
    │   └── (everything else from Week 8)
    └── services/
        ├── userService.js             # NEW
        ├── authService.js
        └── taskService.js
```

## New dependencies

None.

## Architecture

```
Client                         Server
------                         ------
NavBar hides "Admin"           /api/users requires
  from non-admins              authenticate + requireRole("admin")
AdminRoute redirects
  non-admins to /forbidden

Both of these are only UX;
the server is the real gate.
```

## Suggested classroom demonstration

1. Register "Alice" and "Bob" from two browsers. Both are `user`s.
2. Alice tries to visit `/admin`. React Router sends her to `/forbidden`.
3. In Alice's DevTools, try `fetch("/api/users", { credentials: "include" }).then(r => r.status)` →
   **403**. The nav link isn't the real check.
4. In the server terminal: `npm run make-admin -- alice@example.com`.
5. Alice logs out and back in. Nav bar now shows an "Admin" link and
   an `admin` badge. `/admin` lists both users.
6. Bob still sees no Admin link and `/forbidden` on direct visit.

## What students should understand after the lesson

- **Authorization** is a separate concern from authentication.
- Role check lives in a reusable middleware (`requireRole`) that chains
  after `authenticate`.
- The server **never** reads `role` from `req.body`. The source of
  truth is the database.
- **403 Forbidden** means authenticated-but-not-allowed; this is
  different from 404 which hides the resource's existence.
- The UI can hide features for a nicer experience, but that is **not
  security**. The server is still the fortress.
- Granting admin requires a trusted, server-side mechanism (the dev
  script here; in production, usually another admin + audit).
