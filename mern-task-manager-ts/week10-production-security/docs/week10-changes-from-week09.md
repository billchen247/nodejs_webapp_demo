# Week 10 — What changed from Week 9

Week 9 ended with a role-aware admin dashboard and clean 401/403/200
semantics across the API. Week 10 does not add new user-facing features
— it hardens every surface the earlier weeks exposed.

## New files

### Server

- `src/config/security.ts` — single source of truth for TTLs,
  rate-limit windows, reset-token lifetime, `isProd` / `isTest`.
- `src/middleware/rateLimiters.ts` — `authLimiter` (strict) and
  `generalLimiter` (loose); both skip during tests.
- `src/middleware/validate.ts` — `validateBody(schema)` factory.
- `src/schemas/authSchemas.ts` — zod schemas for register, login,
  forgot-password, reset-password + inferred TS types.
- `src/schemas/taskSchemas.ts` — zod schemas for task create/update
  and role update.

### Client

- `src/pages/ForgotPassword.tsx` + its test wiring.
- `src/pages/ResetPassword.tsx` + its test wiring.
- `tests/PasswordReset.test.tsx`.

## Rewritten files

### Server

- `src/auth/jwt.ts` — now exports `signAccessToken`,
  `signRefreshToken`, and `verifyAuthToken(token, expectedType)` with
  a `typ` claim to prevent cross-use.
- `src/auth/cookie.ts` — two cookies instead of one. Access path `/`
  (15m); refresh path `/api/auth` (7d).
- `src/auth/requireAuth.ts` — reads `ACCESS_COOKIE_NAME`, verifies
  with `expectedType = "access"`.
- `src/models/User.ts` — adds `resetTokenHash` + `resetTokenExpiresAt`
  (both `select: false`), plus `createResetToken()` / `hashResetToken()`.
- `src/controllers/authController.ts` — adds `refresh`,
  `forgotPassword`, `resetPassword`; register and login use the new
  cookie helpers; all handlers trust the already-validated `req.body`.
- `src/controllers/taskController.ts` — removes defensive type checks
  that are now the schema's job.
- `src/controllers/userController.ts` — removes the inline role-string
  check; still enforces the "no self-demotion" guard.
- `src/routes/authRoutes.ts` — `authLimiter` + `validateBody(...)` for
  each endpoint; adds `/refresh`, `/forgot-password`, `/reset-password`.
- `src/routes/taskRoutes.ts` — `validateBody(createTaskSchema)` on POST,
  `validateBody(updateTaskSchema)` on PUT.
- `src/routes/userRoutes.ts` — `validateBody(updateRoleSchema)` on PATCH.
- `src/app.ts` — adds `helmet()`, `app.set("trust proxy", 1)`,
  `generalLimiter`, a 100 KB body cap, and hides stack traces outside
  development.

### Client

- `src/services/api.ts` — adds transparent single-flight refresh on 401
  for protected endpoints; `/me` and `/refresh` opt out. Adds
  `forgotPassword` and `resetPassword` entries.
- `src/pages/Login.tsx` — adds a "Forgot password?" link.
- `src/App.tsx` — mounts the two new routes.
- `index.html` — title updated.
- `src/pages/AuthForm.css` — adds `.auth-form__success` and
  `.auth-form__dev` styles.

### Tests

- `server/tests/authApi.test.ts` — rewritten for the two-cookie flow
  and new endpoints:
  - Zod-shaped error responses on bad input.
  - `register` ignores `role` (zod strict).
  - `/refresh` success, missing-cookie 401, token-type mismatch 401.
  - `/forgot-password` 200 for unknown emails, hash + expiry stored
    for real ones.
  - `/reset-password` works once, then rejects the reused token.
- `server/tests/taskApi.test.ts` — adds "unknown fields rejected" and
  "missing title returns details" cases.
- `client/tests/api.test.ts` — adds `forgotPassword` /
  `resetPassword` plus three auto-refresh scenarios.
- `client/tests/PasswordReset.test.tsx` — new.

## Dependency changes

Added in `server/package.json`:

- `helmet@^7.1.0`
- `express-rate-limit@^7.4.0`
- `zod@^3.23.8`

No frontend dependency changes.

## Environment variables

- `NODE_ENV` is now meaningful. In production, cookies get
  `SameSite=None; Secure` and errors hide stack traces. The dev-only
  `devToken` field in `/forgot-password` is suppressed.

## Breaking changes (from Week 9)

- The single auth cookie `mern_task_manager_auth` is replaced by two:
  `mern_task_manager_access` and `mern_task_manager_refresh`.
  Users signed in under Week 9 cookies will need to log in again.
- POST / PUT / PATCH bodies that previously got "friendly" shape fixes
  (e.g. unexpected fields quietly ignored) now return 400 with a
  `details` map.
- `AUTH_COOKIE_NAME` export is gone; `ACCESS_COOKIE_NAME` and
  `REFRESH_COOKIE_NAME` replace it. Test files that imported the old
  name need updating (we did that for the Week 10 snapshot).
