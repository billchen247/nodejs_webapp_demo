# MERN Task Manager — 10-week TypeScript classroom project

A single Task Manager application, built week by week, with each week
living as its own fully-runnable snapshot. Every week folder is a
complete copy of the prior week **plus** that week's new material, so a
student can `cd` into any week and run exactly what the lesson covers.

Author: Bill Chen · Stack: TypeScript, Express, MongoDB (Mongoose), React, Vite · Testing: Vitest, Supertest, React Testing Library.

---

## How to read this project

The weeks tell a story. Each week picks up exactly where the previous
one left off and introduces one layer at a time — never more than one.
By Week 10 the app has every production-realistic concern you would
expect of a small MERN product.

| Week | Focus | What the app does for the first time |
| --- | --- | --- |
| [1](week01-node-basics/) | Node.js + TypeScript basics | A plain in-memory task list that logs operations. |
| [2](week02-express-rest-api/) | Express REST API | HTTP endpoints for CRUD on tasks. |
| [3](week03-mongodb-mongoose/) | MongoDB + Mongoose | Tasks persist across restarts. |
| [4](week04-react-frontend/) | React frontend | A real UI with its own state. |
| [5](week05-mern-fullstack/) | Full MERN integration | Frontend talks to backend over fetch; CORS. |
| [6](week06-authentication/) | Authentication | Register / login with bcrypt + JWT cookies. |
| [7](week07-protected-api-ownership/) | Protected API + ownership | Tasks become per-user; 401 for strangers. |
| [8](week08-react-auth/) | React auth | Protected routes, nav state, context-driven auth. |
| [9](week09-authorization/) | Authorization | Role-based admin dashboard, `requireRole()`. |
| [10](week10-production-security/) | Production security hardening | Helmet, rate limiting, zod validation, refresh tokens, password reset. |

Every week has:

- Its own `README.md` describing the week's goals.
- `docs/weekNN-<topic>.md` — the long-form "why" document.
- `docs/weekNN-changes-from-weekMM.md` — a diff-style changelog from
  the previous week.
- Its own `package.json`, `.env.example`, `.gitignore`, and tests. Each
  week is self-contained; nothing is shared across weeks except the
  teaching narrative.

---

## Running a given week

Pick a week folder and work entirely inside it. The scripts are
identical from Week 5 onward (where the stack goes full-MERN):

```bash
cd week07-protected-api-ownership   # or any other week
npm run install:all                 # installs server + client
cp server/.env.example server/.env  # fill in MONGODB_URI, JWT_SECRET, etc
cp client/.env.example client/.env

# Open two terminals:
npm run dev:server                  # http://localhost:3000
npm run dev:client                  # http://localhost:5173

# Testing (any week with tests)
npm run test                        # runs both suites
npm run test:coverage               # with coverage reports
```

Weeks 1–3 are backend-only; use `npm run dev` inside the week folder.

### Prerequisites

- Node.js 20.x (anything that runs native ESM + `tsx` cleanly).
- A local MongoDB — `brew install mongodb-community` on macOS, or the
  official Docker image: `docker run -d -p 27017:27017 mongo`.
- No `package-lock.json` files are committed; students should produce
  their own on `npm install`.

---

## Learning progression

The project is explicitly designed so each week adds **one** teachable
layer. The order is deliberate: concepts don't make sense out of
sequence.

### Weeks 1–3 — The backend story

- **Week 1** — TypeScript, ES Modules, the Node runtime, basic data
  types. Tasks live in memory.
- **Week 2** — HTTP as a shared vocabulary. Express. JSON requests
  and responses. REST conventions. Status codes.
- **Week 3** — MongoDB, Mongoose schemas, validation at the model
  layer, 404-vs-400 semantics, timestamps.

### Weeks 4–5 — Adding the frontend

- **Week 4** — React 18 with Vite. Components, state, lifting state
  up, controlled inputs. The UI is still mock-data; no API call yet.
- **Week 5** — The two halves meet. CORS. Fetch. Loading / error
  states. Optimistic UI patterns.

### Weeks 6–9 — Users and permissions

- **Week 6** — Authentication. Password hashing with bcrypt. JWTs in
  HttpOnly cookies. `/register`, `/login`, `/logout`, `/me`.
- **Week 7** — Ownership. Tasks become per-user. `requireAuth`
  middleware. 401 (not 403) when the cookie is missing. 404 (not 403)
  for other users' tasks — resource-existence-leak defence.
- **Week 8** — React auth. `AuthContext`, `ProtectedRoute`, nav bar
  state, the pattern "pages ask the context, not the API".
- **Week 9** — Authorization. The `role` field. `requireRole("admin")`.
  An admin dashboard with role-aware UI, but the slogan "hiding a
  button in React is not authorization" is drilled into every demo.

### Week 10 — Production security

Week 10 doesn't add new features. It audits every surface built in
weeks 1–9 and hardens it:

- Short-lived access tokens (15m) + refresh tokens (7d, narrow path).
- Zod validation at the request edge; strict schemas close the
  "register as admin" vulnerability class.
- `express-rate-limit` for `/api/auth/*` and the general API surface.
- `helmet()` baseline headers.
- `trust proxy` so rate limits key on real client IPs.
- Password reset done the right way: hashed tokens in the DB,
  single-use, always-200 to prevent user enumeration.
- Transparent token refresh in the frontend fetch wrapper.
- Stack traces hidden in production, kept in dev.

---

## Final architecture (Week 10)

```
                          ┌──────────────────────────────┐
                          │  React SPA  (Vite + TS)      │
                          │                              │
                          │  AuthProvider → useAuth()    │
                          │  Protected routes + nav      │
                          │  services/api.ts  ◄──────────┼── fetch wrapper
                          │   • credentials: include     │   with single-flight
                          │   • transparent refresh      │   /auth/refresh on 401
                          └──────────────┬───────────────┘
                                         │  HTTPS (prod)
                                         │  SameSite=None/Lax
                                         │  HttpOnly cookies
                                         ▼
             ┌─────────────────────────────────────────────────┐
             │                Express API (Node + TS)          │
             │                                                 │
             │   helmet() ──  trust proxy=1  ──  JSON 100KB    │
             │   cors(origin+credentials)                      │
             │   generalLimiter                                │
             │                                                 │
             │   /api/auth/*       authLimiter + zod schemas   │
             │     register / login / logout / me              │
             │     refresh / forgot-password / reset-password  │
             │                                                 │
             │   /api/tasks/*      requireAuth + task schemas  │
             │                                                 │
             │   /api/users/*      requireAuth + requireRole   │
             │                     + role schema               │
             │                                                 │
             │   error handler: stack hidden in prod           │
             └───────────────────────┬─────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │   MongoDB  (users, tasks)     │
                     │   bcrypt password hashes      │
                     │   sha256 reset-token hashes   │
                     │   indexes on userId, role     │
                     └───────────────────────────────┘
```

### Cookies

| Cookie | Path | Max-Age | Attributes |
| --- | --- | --- | --- |
| `mern_task_manager_access`  | `/`         | 15 minutes | HttpOnly, SameSite, Secure in prod |
| `mern_task_manager_refresh` | `/api/auth` | 7 days     | HttpOnly, SameSite, Secure in prod |

### JWT claims

| Claim | Example | Why |
| --- | --- | --- |
| `sub` | `"507f1f77bcf86cd799439011"` | User id — all `requireAuth` consumers key off this. |
| `typ` | `"access"` \| `"refresh"` | Token type tag; blocks cross-use cookie-swap attacks. |
| `iat`, `exp` | standard | Issued-at + expiry. `exp` differs by `typ`. |

---

## Security audit checklist (the Week 10 outcome)

The idea isn't to memorise the table — it's to be able to defend each
row:

| Concern | Where | Defence |
| --- | --- | --- |
| Password at rest | `models/User.ts` | bcrypt, 10 rounds; `select: false` |
| JWT algorithm | `auth/jwt.ts` | `algorithms: ["HS256"]` pin |
| JWT type confusion | `auth/jwt.ts` | `typ` claim + `expectedType` on verify |
| XSS cookie theft | `auth/cookie.ts` | `HttpOnly` |
| CSRF | `auth/cookie.ts` | `SameSite=Lax` (dev) / `None+Secure` (prod); CORS + credentials |
| Narrow blast radius for refresh | `auth/cookie.ts` | Refresh cookie `path: /api/auth` |
| Credential stuffing / brute force | `middleware/rateLimiters.ts` | `authLimiter`: 20 / 15min |
| General DoS floor | `middleware/rateLimiters.ts` | `generalLimiter`: 300 / min |
| Body-size DoS | `app.ts` | `express.json({ limit: 100kb })` |
| Security headers | `app.ts` | `helmet()` |
| Request-shape attacks | `middleware/validate.ts` + schemas | Zod + `.strict()` |
| Register-as-admin vuln | `schemas/authSchemas.ts` | `.strict()` rejects `role` field |
| User enumeration (login) | `authController.ts` | Same 401 for unknown email + bad password |
| User enumeration (forgot) | `authController.ts` | Always 200 regardless of email existence |
| Resource existence leak | `taskController.ts` | 404 (not 403) on other users' tasks |
| DB leak compromising live sessions | `User.resetTokenHash` | sha256 hash stored, not the token |
| Replay of reset tokens | `authController.ts` | Single-use; fields cleared on redeem |
| Load balancer masking client IPs | `app.ts` | `trust proxy: 1` |
| Stack-trace info leaks | `app.ts` | Hidden in production |

---

## Project conventions (same across every week)

- **TypeScript everywhere**, no JavaScript source files.
- **ES Modules only** (`"type": "module"`, `.js` suffixes in imports),
  no CommonJS.
- Every source file begins with an author header:
  ```ts
  /**
   * Author: Bill Chen
   * Project: MERN Task Manager
   * Week: Week NN
   * File: <relative/path/from/week/root>
   */
  ```
- **Educational comments explain WHY**, not WHAT. Comments like "the
  thing we are defending against here is …" are preferred to
  "increment the counter".
- No Tailwind, Bootstrap, or MUI. Modern plain CSS with custom
  properties lives in `index.css` and per-component `.css` files.
- Vitest + Supertest for the server; Vitest + React Testing Library
  for the client.
- No `package-lock.json` is committed; students install themselves.
- Each week owns its own `.gitignore`.

---

## Where to go next (post-week-10 ideas)

The classroom project stops at Week 10. A natural continuation could add:

- **Deployment** (Vercel + Render, or Fly.io, or a plain VPS with
  nginx and systemd) with a Content-Security-Policy on the frontend.
- **CI** (GitHub Actions): run both test suites on every PR.
- **A shared rate-limit store** (`rate-limit-redis`) for multi-instance
  deployments.
- **Observability**: structured logging (pino) + request IDs.
- **MFA** for admin accounts (TOTP via `otplib`).
- **CSRF double-submit tokens** if you ever need to loosen SameSite.
- **E2E tests** with Playwright hitting a real browser.

Each of these would be a Week-11+ snapshot, following the same
"one layer at a time" discipline.

---

## Credits

Written as a 10-week classroom project by Bill Chen. The lesson arcs
and defence-in-depth framing are strongly influenced by OWASP's Cheat
Sheet series, the "secure by default" guidance in Node.js Security
Working Group materials, and years of accumulated "oh no, that was a
bad idea" from production.
