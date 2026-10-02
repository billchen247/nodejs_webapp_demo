# Week 10 — Production Security

## What this week teaches

> **Before you ship this, what could go wrong?**

Weeks 1–9 built the app's happy paths. Week 10 is the pre-flight
check: the small set of hardening steps that separate "it runs on my
laptop" from "I'm comfortable giving this an internet-facing URL."

## What we add

### Server
- **helmet** — defensive HTTP response headers.
- **express-rate-limit** — three tiers of limiters (global, auth, write).
- **express-validator** — one place where request shape is checked.
- **Strict CORS allowlist** — only configured origins, never `*`.
- **Fail-fast env validation** — the server refuses to boot in
  production with a weak `JWT_SECRET`.
- **Trust proxy configuration** — correct client IPs for rate limiting
  behind a reverse proxy.
- **Password reset** — hashed-at-rest, expiring, single-use tokens.
- **Consistent error handler** — JSON responses only; no stack traces
  in production.
- **Body size limit** — 100 kb cap on JSON requests.
- **Health probe** — `GET /healthz` that doesn't hit the database.
- **Secure cookies in production** — `Secure` flag flips on when
  `NODE_ENV=production`.

### Client
- `/forgot-password` and `/reset-password` pages.
- "Forgot your password?" link on login.

### Docs
- `docs/security-checklist.md` — the final audit students can run
  through for any Node + React app they build.

## Install

```bash
cd week10-production-security/server && npm install
cd ../client && npm install
```

## Configure `.env`

Copy `.env.example` and fill in:

```
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
```

The server will refuse to boot in production (and warn in development)
if `JWT_SECRET` is still the placeholder.

## Run

```bash
cd week10-production-security/server && npm run dev
cd week10-production-security/client && npm run dev
```

## Try the hardening

### Rate limiting

```bash
# 10 bad logins in a row burn the auth bucket:
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nope@example.com","password":"wrong"}'
done
# → ..., 401, 401, 429
```

### Validation

```bash
curl -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"nope","password":"short"}'
# → 400 with { error: "Validation failed", errors: [...] }
```

### CORS allowlist

```bash
curl -i -H "Origin: https://evil.example.com" \
  http://localhost:5000/api/tasks
# → 403 CORS: origin https://evil.example.com not allowed
```

### Helmet headers

```bash
curl -i http://localhost:5000/ | grep -iE "content-security|x-|strict|referrer"
# → X-Content-Type-Options: nosniff
# → X-DNS-Prefetch-Control: off
# → ...
```

### Password reset (dev)

1. Register `alice@example.com` in the UI.
2. Click "Forgot your password?" and submit her email.
3. Look at the server terminal — the reset link is printed there.
4. Open the link, choose a new password, log in.

### `/healthz`

```bash
curl http://localhost:5000/healthz
# → { "ok": true, "env": "development" }
```

## Important files

```
week10-production-security/
├── server/
│   ├── .env.example                 # expanded config
│   ├── package.json                 # + helmet, express-rate-limit, express-validator
│   └── src/
│       ├── server.js                # helmet, strict CORS, rate limit, error handler
│       ├── config/
│       │   ├── env.js               # NEW — fail-fast env validation
│       │   └── auth.js              # cleaned up, cookie flags centralized
│       ├── middleware/
│       │   ├── authenticate.js
│       │   ├── requireRole.js
│       │   ├── rateLimiters.js      # NEW
│       │   └── validate.js          # NEW
│       ├── validators/              # NEW directory
│       │   ├── authValidators.js
│       │   └── taskValidators.js
│       ├── utils/
│       │   └── resetTokens.js       # NEW — SHA-256 hashed tokens
│       ├── models/User.js           # + passwordResetTokenHash, passwordResetExpires
│       ├── controllers/
│       │   ├── authController.js    # + forgotPassword, resetPassword
│       │   └── taskController.js    # thinner — validation moved to middleware
│       ├── routes/
│       │   ├── authRoutes.js        # + rate limit + validators + reset routes
│       │   ├── taskRoutes.js        # + rate limit + validators
│       │   └── userRoutes.js
│       └── scripts/makeAdmin.js
└── client/src/
    ├── App.jsx                      # + /forgot-password, /reset-password
    ├── pages/
    │   ├── ForgotPassword.jsx       # NEW
    │   ├── ResetPassword.jsx        # NEW
    │   └── Login.jsx                # + "Forgot your password?" link
    └── services/authService.js      # + forgotPassword, resetPassword
```

## New dependencies

| Package              | Why                                              |
| -------------------- | ------------------------------------------------ |
| `helmet`             | Sets a bundle of defensive HTTP response headers |
| `express-rate-limit` | Caps requests per IP, blunts brute-force attacks |
| `express-validator`  | Declarative request-shape validation             |

## Architecture

```
request
  │
  ▼
helmet ───►  CORS allowlist ───►  json(100kb) ───►  cookie-parser
                                                        │
                                                        ▼
                                       apiLimiter (per IP, generous)
                                                        │
                            ┌──────────────┬────────────┼─────────────┐
                            ▼              ▼            ▼             ▼
                     authLimiter    writeLimiter    authenticate   authenticate
                     + validators   + validators    + validators   + requireRole
                            │              │            │             │
                            ▼              ▼            ▼             ▼
                       authController  taskController  taskController userController
                            │              │            │             │
                            └──────────────┴────┬───────┴─────────────┘
                                                ▼
                                   centralized error handler
                                   (no stack trace in prod)
```

## Suggested classroom demonstration

1. **Rate limit a login attempt.** Blast the login endpoint and show
   the 429 arrive after the 10th failed attempt. Then wait 15 minutes
   and watch the bucket reset.
2. **Fail CORS from a bad origin.** Use `curl -H "Origin: ..."` to
   show that the backend refuses foreign origins.
3. **Try to post a 1 MB body.** Show the 413 response.
4. **Boot the server with the placeholder JWT_SECRET.** In production
   (`NODE_ENV=production npm start`), the process exits.
5. **Walk the password reset.** Register, forgot, click the console
   link, set a new password, log in with it.
6. **Open the security checklist** (`docs/security-checklist.md`) and
   verify each row against this codebase.

## What students should understand after the lesson

- Security is layered: no single middleware carries the whole load.
- Validation at the boundary complements database constraints.
- Rate limiting is cheap insurance against both abuse and bugs.
- CORS is enforced in the browser — a strict allowlist is still
  essential, but curl and server-side callers don't care.
- Cookies, CORS, HTTPS, and SameSite all interact. The simplest
  default (httpOnly + Secure + lax) protects most real apps.
- Password reset is deceptively tricky: it must not leak account
  existence and must store hashed tokens.
- A security checklist beats memory. Use it on every project.
