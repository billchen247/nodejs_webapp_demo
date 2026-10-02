# Week 9 — Authorization

> **Question of the week:** *You know who the user is. What are they
> allowed to do?*

Week 8 wrapped up **authentication** — we know who the current user is
and have a cookie to prove it. Week 9 adds **authorization**: a per-user
`role`, a `requireRole("admin")` middleware, admin-only API routes, and
a role-aware React dashboard.

The crucial lesson of this week is a slogan worth tattooing somewhere:

> **Hiding a button in React is not authorization.**

The server has to enforce every authorization decision independently.
The UI is a convenience to keep users out of pages that would deny
them anyway.

---

## What this week teaches

- The difference between **authentication** (401 vs 200) and
  **authorization** (403 vs 200).
- Modelling a role as an enum on the User schema with a safe default.
- Writing a composable `requireRole(...)` middleware that chains after
  `requireAuth`.
- Protecting an entire router with `router.use(requireAuth, requireRole("admin"))`
  so new routes can't accidentally be left open.
- Why self-promotion to admin is impossible — the register endpoint
  does not read `req.body.role`.
- Mirroring the backend policy in the frontend with `<RequireRole>` and
  role-aware navigation, while being clear about which layer is the
  security boundary.
- Testing the full matrix: unauth → 401, user → 403, admin → 200.

---

## What changed from Week 8

### Backend
- `models/User.ts` — adds `role: "user" | "admin"` with a safe default.
- `auth/requireAuth.ts` — now does one DB lookup to attach `req.userRole`
  so authorization decisions are always based on the user's current role.
- `auth/requireRole.ts` *(new)* — the authorization middleware.
- `controllers/userController.ts` *(new)* — list / read / updateRole.
- `routes/userRoutes.ts` *(new)* — `/api/users`, protected by
  `requireAuth + requireRole("admin")`.
- `scripts/seedAdmin.ts` *(new)* — a tiny CLI to bootstrap the first admin.
- `app.ts` — mounts `/api/users`.
- `controllers/authController.ts` — explicitly ignores `req.body.role`.

### Frontend
- `types.ts` — `AuthUser` gains a `role` field.
- `services/api.ts` — new `admin` namespace (`listUsers`, `updateRole`).
- `components/RequireRole.tsx` *(new)* — route-level role guard.
- `pages/Admin.tsx` + `Admin.css` *(new)* — admin dashboard.
- `components/NavBar.tsx` — role-aware links, role badge.
- `App.tsx` — mounts the `/admin` route.
- `App.css` — nav + role badge + "forbidden" styles.

### Tests
- `server/tests/userApi.test.ts` *(new)* — authentication (401),
  authorization (403), admin-only CRUD, "cannot self-promote via
  register", "cannot self-demote via PATCH".
- `client/tests/RequireRole.test.tsx` *(new)*.
- `client/tests/Admin.test.tsx` *(new)*.

---

## Installation

```bash
cd week09-authorization
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env — set JWT_SECRET to a long random string.
```

## Bootstrapping the first admin

Because registration can only create plain users, we need a separate
step to create (or promote) an admin. The project ships a one-shot
seeding script:

```bash
# Create or promote an admin by email + password
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=supersecret1 \
  npm --prefix server run seed:admin

# Equivalent CLI form
npm --prefix server run seed:admin -- admin@example.com supersecret1
```

Idempotent: if the email already exists, the user is promoted to
admin without touching their password.

## Running

```bash
npm run dev:server    # http://localhost:3000
npm run dev:client    # http://localhost:5173
```

## Testing

```bash
npm run test               # server + client
npm run test:coverage      # both suites with coverage reports
```

- Server coverage → `server/coverage/index.html`
- Client coverage → `client/coverage/index.html`

---

## API endpoints

### Already protected (from Week 7)
```
GET    /api/tasks              requireAuth
POST   /api/tasks              requireAuth
GET    /api/tasks/:id          requireAuth
PUT    /api/tasks/:id          requireAuth
DELETE /api/tasks/:id          requireAuth
```

### Public auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### New in Week 9 (admin only)
```
GET    /api/users              requireAuth + requireRole("admin")
GET    /api/users/:id          requireAuth + requireRole("admin")
PATCH  /api/users/:id          requireAuth + requireRole("admin")  — body: { role }
```

---

## Suggested classroom demonstration

1. Register two regular users in the browser (`alice@...` and `bob@...`).
2. Open the Network tab, make Alice hit `GET /api/users` manually. She
   gets **403 Forbidden**. The React app also hides the Admin link —
   but demonstrate that the server denies her *regardless* of the UI.
3. Stop the dev server. Run
   `npm --prefix server run seed:admin -- alice@example.com longpass1`.
   Explain why we had to do this outside the public API.
4. Reload the app. Alice's nav bar now shows a role badge "admin" and
   a new "Admin" link. She can promote Bob with a button. The row's
   action for herself is disabled — "admins cannot demote themselves".
5. In DevTools, flip `user.role` to `"admin"` in memory. The link
   "appears" but every `/api/users` call still 403s. Reinforce the
   slogan: *hiding a button in React is not authorization*.

---

## What students should understand after this lesson

- **401 vs 403**: 401 is "I don't know who you are"; 403 is "I know
  who you are and the answer is still no". These are not interchangeable.
- **Authorization is a server concern**. The React guard is for UX
  only. If the server has not independently verified the role on every
  request, it isn't secure.
- **Enums for roles beat free-text strings**. The Mongoose enum means
  that even a buggy controller can't quietly save `role: "superuser"`.
- **A safe default** (`default: "user"`) plus **explicitly ignoring
  client-sent role fields** closes the "register-as-admin" vulnerability.
- **Guard against self-foot-gunning**. An admin demoting themselves is
  almost always a bug; blocking it saves one incident.
