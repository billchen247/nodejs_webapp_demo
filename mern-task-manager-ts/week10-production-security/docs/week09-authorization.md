# Week 9 — Authorization

## The question

Weeks 6–8 answered **"who are you?"** with cookies + JWTs. Week 9
answers the *next* question every real app has to answer:

> **"What are you allowed to do?"**

That is **authorization** — and it's a separate concern from
authentication.

## Authentication vs Authorization

| | Authentication | Authorization |
|---|---|---|
| Question | Who are you? | What are you allowed to do? |
| Failure | 401 Unauthorized | 403 Forbidden |
| Middleware | `requireAuth` | `requireRole("admin")` |
| Fix for failure | Log in | *Nothing you can do; ask an admin* |

A real API almost always runs them together, in that order:

```
Request → requireAuth → requireRole("admin") → controller
                 ↓             ↓
                401           403
```

## The role model

```ts
export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
```

Two roles. That is intentionally small — real teams often regret
introducing half a dozen "roles" that nobody can describe. Grow it
only when you have a use case nobody can achieve by combining the
existing ones.

The schema:

```ts
role: {
  type: String,
  enum: USER_ROLES,
  default: "user",   // safe default
  required: true,
  index: true,
}
```

Three things to notice:

1. **`enum`** rejects stray values at the DB layer. Even a buggy
   controller cannot write `role: "superuser"`.
2. **`default: "user"`** means a new document is always a plain user.
3. **`index`** makes "list all admins" trivially fast.

## Three ways to shoot yourself in the foot

The register endpoint pattern below is a *very* common mistake:

```ts
// Bad
const user = await User.create({ ...req.body });
```

If the client sends `{ email, password, role: "admin" }`, that user
is created as an admin. We dodge this in two steps:

1. Hand-pick the fields we want:
   ```ts
   await User.create({ email, passwordHash, name: safeName });
   ```
2. Rely on the schema default. There is no code path that reads
   `req.body.role` during registration.

The second footgun is **trusting the role in the JWT**. We don't:
`requireAuth` does one indexed `findById` to read the *current* role
from Mongo. A user demoted at 09:01 can no longer act as an admin at
09:02, instead of having to wait for their token to expire.

The third footgun is **letting an admin demote themselves**. One
careless click can lock the system out of admin access entirely. We
return 400 with a clear message instead.

## The `requireRole` factory

```ts
export function requireRole(...allowed: UserRole[]) {
  return function roleGuard(req, res, next) {
    const role = req.userRole;
    if (!role) return res.status(401).json({ error: "Not authenticated" });
    if (!allowed.includes(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

A factory so a route can say `requireRole("admin")` or
`requireRole("admin", "editor")`. Short, boring, obviously correct —
exactly what a security primitive should be.

The 401 branch is a conservative default. If somebody forgets
`requireAuth` upstream, the middleware fails closed with "please log
in" instead of leaking "this endpoint exists but you can't use it".

## Mirroring the policy in the UI

The React side provides two things:

1. **`<RequireRole role="admin">`** — route-level guard. Renders
   the children for admins, redirects anonymous users to `/login`,
   and shows an explicit "Forbidden" screen for logged-in users with
   the wrong role.
2. **`NavBar`** — hides the Admin link from non-admins (and shows a
   little role badge).

The important part — repeat it with the class — is that **this is UX,
not security**. Anyone can open DevTools, flip `user.role` in memory,
and watch the Admin link appear. The server, independently, will keep
returning 403 to that user's requests. The React guard reduces
surprise; the backend guard enforces policy.

## The test matrix

Every admin route needs these three cases:

```
Unauthenticated   → 401
Authenticated user → 403
Authenticated admin → 200/201/204
```

See `server/tests/userApi.test.ts` for the full set.

## Why not RBAC/ABAC/OPA for a classroom app?

Role-based access control at this scale is three lines of middleware.
Pulling in a policy engine (Casbin, OPA, Oso) is powerful but hides
the mechanics students are supposed to be learning this week. Reach
for one when you have more than a handful of roles and permissions,
or when non-engineers need to edit the policies.

## Next week

Week 10 adds the production security controls that would turn this
app into something you could put on the internet without immediately
regretting it: rate limiting, security headers, better cookie
settings, request validation, JWT expiration + refresh, and a
password-reset flow.
