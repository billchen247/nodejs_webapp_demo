# Week 9 — Changes from Week 8

## What We Had Before

- Authenticated per-user task API.
- React with AuthContext, routing, ProtectedRoute.
- No roles — everyone was equal.

## What We Added

### Server
- `role` field on `User`, defaulting to `"user"`.
- A `ROLES` constant.
- `requireRole(...roles)` middleware factory.
- Admin-only `userController` + `userRoutes` at `/api/users`.
- `authenticate` now exposes `role` on `req.user`.
- `scripts/makeAdmin.js` + `npm run make-admin` for safe promotion.

### Client
- `userService.js`.
- `AdminRoute` component.
- `Admin.jsx` page listing all users.
- `Forbidden.jsx` page.
- `NavBar` learns about admin: hides the Admin link for non-admins and
  shows a small admin badge next to the name.

## What We Changed

- `User.toSafeJSON()` now includes `role`.
- `authController.register` always sets `role: "user"` (ignores req.body).
- `App.jsx` adds `/admin` + `/forbidden` routes.
- `NavBar.jsx` adapts to the role.
- `index.html` title.

## Files Added

- `server/src/middleware/requireRole.js`
- `server/src/controllers/userController.js`
- `server/src/routes/userRoutes.js`
- `server/scripts/makeAdmin.js`
- `client/src/components/routes/AdminRoute.jsx`
- `client/src/pages/Admin.jsx` + `.css`
- `client/src/pages/Forbidden.jsx` + `.css`
- `client/src/services/userService.js`
- `docs/week09-authorization.md`
- `docs/week09-changes-from-week08.md`

## Files Modified

- `server/package.json`
- `server/src/models/User.js`
- `server/src/middleware/authenticate.js`
- `server/src/controllers/authController.js`
- `server/src/server.js`
- `client/src/App.jsx`
- `client/src/components/NavBar.jsx` + `NavBar.css`
- `client/index.html`
- `README.md`

## Dependencies Added

None.

## Architecture Change

```
Week 8                              Week 9
-------                             -------
authentication only              →  authentication + authorization
"logged in" vs "anonymous"       →  "admin" vs "user" vs anonymous
/api/tasks (per-user)            →  + /api/users (admin only)
ProtectedRoute                   →  ProtectedRoute + AdminRoute
```

## New Concepts

- Role-based authorization.
- Middleware factories.
- 401 vs. 403 vs. 404 — final usage.
- Why some operations don't belong behind the public API at all.
- Hiding ≠ securing.

## Why We Made These Changes

A real application has more than one tier of user. Introducing roles
*after* authentication and ownership keeps the teaching staircase
even: each week adds one well-defined concept.

## Classroom Demonstration

1. Register two users in two browsers.
2. Both see Tasks but not Admin.
3. From DevTools, confirm `/api/users` returns 403.
4. From the server terminal, run `npm run make-admin -- <email>`.
5. That user logs out + in. The Admin link appears. `/api/users`
   returns 200.
6. The other user still gets 403.
7. Discuss: what would happen if a hacker edited React to show the
   Admin link to themselves? (Nothing — the server still refuses.)
