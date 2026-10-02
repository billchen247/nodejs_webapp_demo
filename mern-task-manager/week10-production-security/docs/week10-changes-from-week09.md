# Week 10 — Changes from Week 9

## What We Had Before

- Authenticated per-user API.
- Role-based authorization with `admin` / `user`.
- All validation lived in controllers (or Mongoose).
- Single `CLIENT_URL` env var.
- No helmet, no rate limiting, no password reset.

## What We Added

### Server
- **helmet** middleware.
- **express-rate-limit** with three tiers (`apiLimiter`,
  `authLimiter`, `writeLimiter`).
- **express-validator** validators under `src/validators/`.
- `src/middleware/validate.js` — one helper to turn validator errors
  into a clean 400 response.
- `src/config/env.js` — fail-fast env validation; refuses to start in
  production with a weak `JWT_SECRET`.
- `src/utils/resetTokens.js` — crypto helper that returns `{raw,
  hash, expiresAt}`.
- Password reset endpoints:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- `/healthz` liveness probe.
- Strict CORS allowlist (`CLIENT_URLS` is now a comma-separated list).
- 100 kb body size limit.
- Centralized error handler that hides details in production.
- `trust proxy` setting driven by `TRUST_PROXY` env var.
- `User.passwordResetTokenHash` and `User.passwordResetExpires`.
- Login equalizes timing with a dummy bcrypt compare when the email
  isn't found.

### Client
- `ForgotPassword.jsx` and `ResetPassword.jsx` pages.
- "Forgot your password?" link on login.
- `authService.forgotPassword` and `authService.resetPassword`.

### Docs
- `docs/security-checklist.md` — the final audit sheet.

## What We Changed

- `.env.example` reorganized; many new variables.
- `authController.register` and `login` now rely on validators (less
  manual checking).
- `taskController.*` are thinner now that validators run upstream.
- `authRoutes` + `taskRoutes` chain the limiters and validators.
- `User.toSafeJSON()` is unchanged, but new reset fields are
  `select: false` so they never leak.
- `App.jsx` adds two new routes; title and subtitle updated.
- `Login.jsx` uses `Link` to router paths and shows the forgot link.

## Files Added

- `server/src/config/env.js`
- `server/src/middleware/rateLimiters.js`
- `server/src/middleware/validate.js`
- `server/src/validators/authValidators.js`
- `server/src/validators/taskValidators.js`
- `server/src/utils/resetTokens.js`
- `client/src/pages/ForgotPassword.jsx`
- `client/src/pages/ResetPassword.jsx`
- `docs/security-checklist.md`
- `docs/week10-production-security.md`
- `docs/week10-changes-from-week09.md`

## Files Modified

- `server/package.json`
- `server/.env.example`
- `server/src/server.js`
- `server/src/config/auth.js`
- `server/src/models/User.js`
- `server/src/controllers/authController.js`
- `server/src/controllers/taskController.js`
- `server/src/routes/authRoutes.js`
- `server/src/routes/taskRoutes.js`
- `client/src/App.jsx`
- `client/src/services/authService.js`
- `client/src/pages/Login.jsx`
- `client/index.html`
- `README.md`

## Dependencies Added

- `helmet@^7.1.0`
- `express-rate-limit@^7.4.0`
- `express-validator@^7.2.0`

## Architecture Change

```
Week 9                             Week 10
-------                            -------
cors(single origin)             →  cors(allowlist) + helmet
ad-hoc validation in handlers   →  express-validator at the edge
unlimited requests              →  3-tier rate limiting
no account-recovery flow        →  hashed-token reset
single CLIENT_URL               →  CLIENT_URLS (comma list)
boot even with weak secret      →  assertSafeEnvOrExit on startup
stack traces in all responses   →  JSON only; detail hidden in prod
```

## New Concepts

- Defense in depth.
- Allowlists over denylists.
- Fail fast on insecure config.
- Account-enumeration resistance.
- Hash-at-rest for sensitive tokens.
- Timing-equalized login.
- `trust proxy` and why rate limiting cares about it.

## Why We Made These Changes

The app is finally close to something you'd deploy. Each new middleware
addresses a real class of attack we've been able to ignore while
teaching the happy path. The password reset flow completes the auth
story that began in Week 6, and the security checklist is the
transferable artifact — students take it to every future project.

## Classroom Demonstration

1. Register "Alice" and log in.
2. Burn the auth rate limit with 11 bad logins — show the 429.
3. Submit a 2 MB body to `POST /api/tasks` — show the 413.
4. Hit the API from a disallowed Origin — show the 403.
5. Trigger `POST /api/auth/forgot-password`; show the reset link
   printed in the server terminal (not stored raw in Mongo — show
   the hash via a `db.users.findOne({})` in the mongo shell).
6. Set a new password at `/reset-password?token=...`; log in with it.
7. Walk `docs/security-checklist.md` together.
