# Week 9 — Teaching Notes

## Learning goals

- Students can distinguish authentication and authorization in one sentence.
- Students can write and compose a `requireRole` middleware.
- Students can design a safe path to promote a user to admin.
- Students can list the status codes used in each failure case.
- Students can explain why the UI alone cannot enforce authorization.

## Core concepts

### Roles

```js
export const ROLES = Object.freeze({ USER: "user", ADMIN: "admin" });
```

A small, enumerated set. For teaching we use just two. Larger systems
often use a many-to-many `permissions` relationship or RBAC libraries,
but the underlying idea is identical: `req.user` carries attributes;
middleware decides what to allow.

### `requireRole`

```js
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

- Composable: works with `authenticate` already in place.
- Factory pattern: returns a middleware. Use with
  `requireRole("admin")` or `requireRole("admin", "editor")`.

### 401 vs. 403 vs. 404 — final cheat sheet

| Code | Meaning                                      | Used when                          |
| ---- | -------------------------------------------- | ---------------------------------- |
| 401  | Not authenticated                            | No/invalid cookie                  |
| 403  | Authenticated but lacks permission           | `/api/users` as a plain user       |
| 404  | Not found (or hidden from this user)         | Another user's task                |

Rule of thumb: for *resources you own*, 404 is friendlier because it
doesn't leak existence. For *clearly public URLs* that this user just
cannot access (admin dashboards), 403 is the honest answer.

### "Hiding is not security"

A hostile user:

1. Opens DevTools.
2. Runs `fetch("/api/users", { credentials: "include" })`.
3. Gets 403. 

If the client *claimed* they were an admin by, say, setting `role` in
`localStorage`, nothing on the server would change. The server reads
the role from MongoDB via the JWT subject — not from anything the
client sends.

### Why no "promote me" endpoint

If a user can set their own role, every account becomes a potential
admin. The dev script (`npm run make-admin`) is deliberately out of
reach of the HTTP surface.

## Common student questions

**Why doesn't logging out and in change my role immediately?**
It does — the server loads the current `role` from the DB in
`authenticate`. The `/me` call after login returns the fresh role.

**Why do I need both the AdminRoute and the server check?**
The server check keeps the data safe. The AdminRoute keeps the UX nice
(you don't want to click a link and see a 403 screen if we can prevent
that).

**Could I use permissions instead of roles?**
Yes — larger systems do. For teaching, roles are enough and the
mental model generalizes.
