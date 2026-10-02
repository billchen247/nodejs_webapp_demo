# Week 10 — Production Security Hardening

> **Question of the week:** *The app works. The auth works. Which part
> would an auditor flag before you shipped it?*

Weeks 1–9 built a working, user-aware task manager with role-based
access control. Week 10 takes everything already in the app and makes
it *production-ready* from a security standpoint. Nothing new in the
feature list — a lot of new weight behind every existing endpoint.

The crucial lesson of this week is that security is a *layered*
property. No single piece on this page is a silver bullet; each
one makes the next weakness harder to reach.

---

## What this week teaches

- Separating **short-lived access tokens** from **long-lived refresh
  tokens** so a compromised access token has a 15-minute blast radius,
  not seven days.
- Scoping cookies with narrow `path` + `HttpOnly` + `SameSite` + `Secure`
  so the browser only sends them where they belong.
- **Zod validation** at the request boundary — one source of truth for
  both runtime validation and TypeScript types.
- **Rate limiting**: strict on auth endpoints, loose on the rest; the
  app behaves normally but credential stuffing becomes uneconomical.
- **Helmet** security headers as a safe baseline.
- A **password reset** flow built the right way: hashed tokens in the
  database, single-use, always-200 to prevent user enumeration.
- A **transparent token refresh** in the frontend fetch wrapper so
  callers never have to think about expiry.
- Hiding error stacks from clients in production, but keeping them in
  development.
- Reading `trust proxy` carefully so rate limiters key on real client
  IPs rather than the load balancer's.

---

## What changed from Week 9

### Backend

- `config/security.ts` *(new)* — one place for every tunable: TTLs,
  rate-limit windows, reset-token lifetime, `isProd` / `isTest` helpers.
- `auth/jwt.ts` — split into `signAccessToken` + `signRefreshToken` +
  `verifyAuthToken(token, "access" | "refresh")`. Every token carries a
  `typ` claim so it cannot be reused across types.
- `auth/cookie.ts` — two cookies: `mern_task_manager_access` (path `/`,
  15m) and `mern_task_manager_refresh` (path `/api/auth`, 7d).
- `middleware/rateLimiters.ts` *(new)* — `authLimiter` for the auth
  surface, `generalLimiter` for everything else; both skip in tests.
- `middleware/validate.ts` *(new)* — `validateBody(schema)` factory.
- `schemas/authSchemas.ts` *(new)* — `register`, `login`, `forgot-password`,
  `reset-password` all `.strict()`; email normalised at the schema edge.
- `schemas/taskSchemas.ts` *(new)* — task create/update + role update.
- `models/User.ts` — adds `resetTokenHash` + `resetTokenExpiresAt`
  (both `select: false`), plus `createResetToken()` / `hashResetToken()`.
- `controllers/authController.ts` — adds `refresh`, `forgotPassword`,
  `resetPassword`; login + register use the new cookie helpers; all
  bodies are trusted after zod has run.
- `routes/authRoutes.ts` — `authLimiter` + `validateBody(...)` wired in.
- `routes/taskRoutes.ts` / `routes/userRoutes.ts` — `validateBody(...)`.
- `app.ts` — adds `helmet`, `trust proxy`, `generalLimiter`, body-size
  cap, and hides stack traces in production.

### Frontend

- `services/api.ts` — single-flight transparent refresh on 401, plus
  `forgotPassword` / `resetPassword` entries.
- `pages/ForgotPassword.tsx` *(new)* + `pages/ResetPassword.tsx` *(new)*.
- `pages/Login.tsx` — adds a "Forgot password?" link.
- `App.tsx` — new `/forgot-password` and `/reset-password` routes.
- `pages/AuthForm.css` — success + dev-only token styles.

### Tests

- `server/tests/authApi.test.ts` — expanded: zod error shape, refresh
  success/failure, token-type mismatch rejection, forgot-password 200
  for unknown emails, single-use reset tokens.
- `server/tests/taskApi.test.ts` — rejects unknown fields + missing title.
- `client/tests/api.test.ts` — adds `forgotPassword` / `resetPassword`,
  plus three auto-refresh scenarios (retry on 401, no retry on `/me`,
  gives up when refresh fails).
- `client/tests/PasswordReset.test.tsx` *(new)*.

---

## Installation

```bash
cd week10-production-security
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env — generate a JWT_SECRET with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

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

## Bootstrapping the first admin

The seed script from Week 9 is still in place:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=supersecret1 \
  npm --prefix server run seed:admin
```

---

## API endpoints

### Authentication (rate-limited, zod-validated)

```
POST   /api/auth/register           { email, password, name? }
POST   /api/auth/login              { email, password }
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh            [refresh cookie only]
POST   /api/auth/forgot-password    { email }
POST   /api/auth/reset-password     { token, newPassword }
```

### Tasks (requireAuth)

```
GET    /api/tasks
POST   /api/tasks                   { title, description?, completed? }
GET    /api/tasks/:id
PUT    /api/tasks/:id               { title?, description?, completed? }
DELETE /api/tasks/:id
```

### Users (requireAuth + requireRole("admin"))

```
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id               { role: "user" | "admin" }
```

---

## Security audit checklist

| Concern | Where it lives | Why |
| --- | --- | --- |
| Password hashing | `models/User.ts` (`bcrypt`, 10 rounds) | Rainbow-table-resistant |
| JWT algorithm pin | `auth/jwt.ts` (`algorithms: ["HS256"]`) | Blocks the "alg: none" family |
| JWT type tag | `auth/jwt.ts` (`typ: "access"` vs `"refresh"`) | Prevents cross-use swap attacks |
| HttpOnly cookies | `auth/cookie.ts` | JS cannot read the token |
| Narrow refresh cookie | `auth/cookie.ts` (`path: "/api/auth"`) | Refresh never travels with API calls |
| SameSite + Secure | `auth/cookie.ts` | CSRF defence; HTTPS-only in prod |
| Helmet headers | `app.ts` | Safe baseline (nosniff, HSTS, etc) |
| Body size cap | `app.ts` (`express.json({ limit })`) | Blocks oversized JSON DoS |
| Rate limiting (auth) | `middleware/rateLimiters.ts` | Credential stuffing / enumeration |
| Rate limiting (general) | `middleware/rateLimiters.ts` | Baseline abuse mitigation |
| Zod validation | `middleware/validate.ts` + schemas | Shape + bounds + unknown-field rejection |
| strict schemas | `schemas/*.ts` | Register cannot smuggle `role: "admin"` |
| Password reset hashing | `models/User.ts` | DB leak does not grant live resets |
| Single-use reset tokens | `controllers/authController.ts` | Token cleared after first use |
| User-enumeration safety | `/forgot-password` always 200 | Attacker can't probe which emails exist |
| Same-error login | `/login` identical message | Attacker can't tell email vs password |
| 404-over-403 for tasks | `taskController.ts` | Reduces resource-existence leaks |
| Stack traces hidden | `app.ts` (production only) | Internal paths not exposed to callers |
| trust proxy = 1 | `app.ts` | Rate limiter sees real client IPs |

---

## Suggested classroom demonstration

1. **Zod + strict**: register with `{ role: "admin" }` — the server
   returns 400 "Validation failed" with a details map listing `role`
   as an unexpected key. Reinforce: *the schema is the gate*.
2. **Short access token**: in DevTools, delete the access cookie but
   keep the refresh cookie. Reload the Task page. In the Network tab,
   `/api/tasks` 401s, `/api/auth/refresh` 200s, `/api/tasks` retries
   200 — all invisible to the user. Reinforce: *the UX never sees the
   expiry; the fetch wrapper owns it*.
3. **User enumeration**: hit `/api/auth/forgot-password` twice — once
   with a real email, once with a nonsense one. Both responses are
   `200 { ok: true }`. Only the real one creates a `resetTokenHash` in
   the DB (open MongoDB Compass to prove it). Reinforce: *the response
   must not reveal what the DB knows*.
4. **Rate limiting**: `for i in {1..30}; do curl -X POST -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"wrong"}' localhost:3000/api/auth/login; done`
   The last requests return `429 Too Many Requests` with the standard
   `RateLimit-Remaining: 0` header.
5. **Password reset**: trigger forgot-password; copy the dev token from
   the response; use `/reset-password` to set a new password; reuse the
   same token to prove it is now rejected (single-use).

---

## What students should understand after this lesson

- **Depth beats cleverness.** No single piece on the list closes an
  attack class on its own. Removing any one piece *should* still leave
  the attack hard; that's the test for whether the layers are doing
  their job.
- **Validation is a layer, not a method call.** Push shape-checking to
  the request boundary with zod; stop controllers from re-validating.
- **Short-lived access + narrow refresh** is the pattern the industry
  settled on for cookie-based SPAs. Memorise it.
- **A reset token is a password**: hash it, don't log it, keep it
  short-lived, make it single-use, and refuse to reveal whether an
  email corresponds to a real user.
- **Rate limiting cares about the real client IP.** Trust the proxy, or
  one bucket covers the entire internet.
- **Error ergonomics matter.** Internal stack traces in production are
  a cheap gift to attackers. Keep them in dev.
