# Security Checklist

A pragmatic pre-ship audit for Node + Express + Mongo + React apps.
Each row has a sentence saying *why* it's on the list.

## Secrets

- [ ] `JWT_SECRET` is at least 48 random bytes (hex or base64). Short
      secrets can be brute-forced offline from a captured token.
- [ ] `.env` is in `.gitignore`. No secret has ever been committed.
      Check `git log -p -- .env`.
- [ ] Secrets in production come from a secret manager (AWS Secrets
      Manager, GCP Secret Manager, Vercel/Fly env), not a checked-in
      `.env` file.
- [ ] Rotating a secret is a documented runbook, not a hero task.

## Authentication

- [ ] Passwords are hashed with bcrypt (cost ≥ 12), argon2, or scrypt.
      Never SHA-256, never plain.
- [ ] Password field is `select: false` in the user model so it can't
      be returned by accident.
- [ ] Login responses do not say "email not found" vs "wrong
      password" — same message either way.
- [ ] Login timing is roughly constant whether or not the email
      exists (dummy bcrypt compare on the miss branch).
- [ ] JWT is in an `HttpOnly` cookie, not `localStorage`.
- [ ] Cookies set `Secure` in production and `SameSite=Lax` (or
      `Strict`).
- [ ] JWT has an `expiresIn`. 7 days is a reasonable default; shorter
      for sensitive apps.
- [ ] There is a logout endpoint that clears the cookie.

## Password reset

- [ ] Reset tokens are random (`crypto.randomBytes(≥ 32)`), not
      guessable (`Math.random`, timestamps, incrementing ids).
- [ ] Reset tokens are stored as a hash (SHA-256 or bcrypt). The raw
      token exists only in the email.
- [ ] Reset tokens expire within 15–60 minutes.
- [ ] Reset tokens are single-use (cleared on successful reset).
- [ ] The forgot-password endpoint returns the same response for
      known and unknown emails — no account enumeration.
- [ ] After reset, the user must log in with the new password (we do
      not silently open a session).

## Authorization

- [ ] Every protected endpoint runs through `authenticate` before any
      business logic.
- [ ] Every per-user resource is queried with `{ _id, userId }`, not
      just `{ _id }`. "Can see" and "can edit" are enforced on the
      database query, not the controller branch.
- [ ] Cross-user access returns 404 (not 403) so resource existence
      isn't leaked.
- [ ] Role is set only by the server, never from the request body.
- [ ] Admin promotion is a server-side script or another-admin flow,
      not a public endpoint.

## Input validation

- [ ] Every mutating endpoint has an input validator (shape, length,
      type).
- [ ] Validation errors return a structured 400 with per-field
      messages.
- [ ] IDs are checked with `mongoose.isValidObjectId` before being
      queried.
- [ ] Request body size is capped (`express.json({ limit: "100kb" })`).
- [ ] File uploads (if any) have an explicit max size and MIME-type
      allowlist.

## Transport / headers

- [ ] HTTPS is terminated at the edge; HTTP redirects to HTTPS.
- [ ] `helmet()` or an equivalent sets `X-Content-Type-Options`,
      `Strict-Transport-Security`, `Referrer-Policy`, etc.
- [ ] A Content Security Policy covers HTML responses (not needed on
      a pure JSON API).
- [ ] CORS is configured with an explicit allowlist of origins. Never
      `*` combined with `credentials: true`.

## Rate limiting

- [ ] Global per-IP cap on `/api` requests.
- [ ] Tighter cap on auth endpoints (login, register, forgot, reset).
- [ ] `app.set("trust proxy", N)` matches the actual proxy depth so
      `req.ip` is the real client IP.
- [ ] Rate limiter failure response is 429 with a `Retry-After`
      hint (helmet/express-rate-limit does this for you).

## Error handling and logging

- [ ] Centralized error handler returns JSON only.
- [ ] Stack traces are never returned to the client in production.
- [ ] 404 and 500 bodies do not leak file paths, library versions, or
      DB field names.
- [ ] Error-level logs include correlation data (request id, user id)
      and NOT secrets, passwords, or raw tokens.

## Database

- [ ] Mongo URI uses auth. There is no `root/root` instance pointed
      at the public internet.
- [ ] Indexes exist on fields used in `findOne` lookups (`email`,
      `userId`). Both for performance and to prevent slow queries
      from being a DoS vector.
- [ ] Backups are tested, not just configured.

## Deployment

- [ ] `NODE_ENV=production` in all non-development environments.
- [ ] Health check endpoint (`/healthz`) does not hit the database so
      the load balancer can distinguish "pod is up" from "DB is down."
- [ ] Containers run as a non-root user.
- [ ] Secrets are injected via env vars, not baked into the image.
- [ ] Dependencies are pinned (`package-lock.json` committed in the
      production repo; teaching repos may ignore it).

## Monitoring

- [ ] Application errors stream to a central logger (Datadog, Sentry,
      CloudWatch, etc.).
- [ ] A single failed-login spike is visible on a dashboard — or at
      least queryable in logs.
- [ ] Alerts fire on error-rate changes, not just on uptime.

## Dependencies

- [ ] `npm audit` runs in CI; critical and high findings block merge.
- [ ] Dependabot/Renovate or similar is enabled.
- [ ] You know how to pin and roll back a vulnerable dependency.

## Human factors

- [ ] A new engineer has a runbook for rotating secrets, deploying,
      and rolling back.
- [ ] Access to production (DB, logs, SSH) is restricted and logged.
- [ ] Someone other than the author has read the auth code.

---

If you can tick every box, you have an app that is more secure than
most production SaaS products at launch. Keep this file. Run it on
every project you build.
