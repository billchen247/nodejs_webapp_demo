# Week 6 — Authentication

## What this week teaches

> **Who are you?**

We add a `User` model, password hashing with bcrypt, JWTs, HTTP-only
cookies, and `/register` / `/login` / `/logout` / `/me` endpoints. The
React app grows a login page, a registration page, a nav bar, and the
notion of a signed-in user.

Note: tasks are still **not** per-user yet. That belongs to Week 7
("Can you access this?"). We teach authentication and authorization
one at a time.

## What changed from Week 5

### Server
- Added `bcrypt`, `jsonwebtoken`, `cookie-parser`.
- New `src/models/User.js` with `passwordHash` (`select: false`) and
  `toSafeJSON()` to strip sensitive fields.
- New `src/config/auth.js` — JWT signing/verifying and cookie options
  in one place.
- New `src/controllers/authController.js` — `register`, `login`,
  `logout`, `me`.
- New `src/routes/authRoutes.js`.
- `src/server.js` — mounted `/api/auth`, added `cookieParser()`.
- `.env.example` — added `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`.

### Client
- `services/taskService.js` → shared `request()` helper now sends
  cookies with `credentials: "include"`.
- New `services/authService.js` for the four auth endpoints.
- New `pages/Login.jsx`, `pages/Register.jsx`, shared `AuthForm.css`.
- New `components/NavBar.jsx` + `.css`.
- `App.jsx` owns `user` state, calls `GET /api/auth/me` on mount,
  switches between the Home / Login / Register views, offers Logout.
- `Home.jsx` accepts a `user` prop and shows a sign-in hint when anonymous.

## Prerequisites

Same as Week 5 (MongoDB).

## Install

```bash
cd week06-authentication/server && npm install
cd ../client && npm install
```

## Configure `.env`

```bash
# server
cd server
cp .env.example .env
# IMPORTANT: generate a strong JWT_SECRET, e.g.
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# client
cd ../client
cp .env.example .env
```

| File              | Variable             | Notes |
| ----------------- | -------------------- | ----- |
| `server/.env`     | `PORT`               | Default 5000 |
| `server/.env`     | `MONGODB_URI`        | Default local Mongo |
| `server/.env`     | `CLIENT_URL`         | Default `http://localhost:5173` |
| `server/.env`     | `JWT_SECRET`         | **Required.** Long random string. |
| `server/.env`     | `JWT_EXPIRES_IN`     | Default `7d` |
| `server/.env`     | `NODE_ENV`           | `development` locally |
| `client/.env`     | `VITE_API_URL`       | `http://localhost:5000` |

## Run

```bash
cd week06-authentication/server && npm run dev
cd week06-authentication/client && npm run dev
```

## API endpoints

Auth (new):

| Method | Path                   | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| POST   | `/api/auth/register`   | Create account, set auth cookie     |
| POST   | `/api/auth/login`      | Verify credentials, set auth cookie |
| POST   | `/api/auth/logout`     | Clear auth cookie                   |
| GET    | `/api/auth/me`         | Return current user or 401          |

Tasks (unchanged this week; still shared):

| Method | Path              |
| ------ | ----------------- |
| GET    | `/api/tasks`      |
| GET    | `/api/tasks/:id`  |
| POST   | `/api/tasks`      |
| PUT    | `/api/tasks/:id`  |
| DELETE | `/api/tasks/:id`  |

### Try the auth API with curl

```bash
# Register (saves the cookie into cookies.txt)
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"hunter2hunter2"}'

# Me (sends the cookie back)
curl -b cookies.txt http://localhost:5000/api/auth/me

# Logout
curl -b cookies.txt -X POST http://localhost:5000/api/auth/logout

# Me again (now 401)
curl -i -b cookies.txt http://localhost:5000/api/auth/me
```

## Important files

```
week06-authentication/
├── server/
│   ├── package.json                 # + bcrypt, jsonwebtoken, cookie-parser
│   ├── .env.example                 # + JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV
│   └── src/
│       ├── server.js                # + cookieParser, mounts /api/auth
│       ├── config/
│       │   ├── database.js
│       │   └── auth.js              # NEW: JWT + cookie helpers
│       ├── models/
│       │   ├── Task.js
│       │   └── User.js              # NEW
│       ├── controllers/
│       │   ├── taskController.js
│       │   └── authController.js    # NEW
│       └── routes/
│           ├── taskRoutes.js
│           └── authRoutes.js        # NEW
└── client/
    └── src/
        ├── App.jsx                  # owns user state; switches views
        ├── services/
        │   ├── taskService.js       # credentials: include + shared request()
        │   └── authService.js       # NEW
        ├── pages/
        │   ├── Home.jsx             # takes a `user` prop
        │   ├── Login.jsx            # NEW
        │   ├── Register.jsx         # NEW
        │   └── AuthForm.css         # NEW shared styles
        └── components/
            ├── NavBar.jsx           # NEW
            ├── NavBar.css           # NEW
            ├── TaskForm.jsx
            ├── TaskList.jsx
            └── TaskItem.jsx
```

## New dependencies

Server:
| Package | Why |
| ------- | --- |
| `bcrypt` | Password hashing. |
| `jsonwebtoken` | Signing and verifying auth tokens. |
| `cookie-parser` | Reading `req.cookies`. |

## Architecture

```
Browser
  │  (cookie: token=…)
  ▼
Express
  ├── /api/auth/register ──> bcrypt + save user ──> set cookie
  ├── /api/auth/login    ──> bcrypt.compare       ──> set cookie
  ├── /api/auth/logout   ──> clear cookie
  └── /api/auth/me       ──> jwt.verify           ──> return user

Mongo
  └── users (new)
  └── tasks (shared, unchanged this week)
```

## Suggested classroom demonstration

1. Open DevTools → Application → Cookies before you start.
2. Register "Alice" in the UI. In DevTools, show the `token` cookie:
   `HttpOnly`, `SameSite=Lax`, path `/`.
3. Reload the page. The nav bar still shows "Hi, Alice" because `GET /api/auth/me` succeeds via the cookie.
4. In MongoDB Compass, open the `users` collection — point out `passwordHash`
   (bcrypt hash, not plain text).
5. Attempt to log in with the wrong password → generic "Invalid email or password".
6. Click Logout → cookie disappears → `/api/auth/me` returns 401.
7. Compare with a request that would store a JWT in `localStorage` — explain
   why cookies are preferred (XSS reach, automatic sending, revocation).

## What students should understand after the lesson

- **Passwords are never stored in plaintext.** Bcrypt is a slow, salted hash.
- **JWT** is a signed token the server trusts because it signed it.
- **HTTP-only cookies** cannot be read by JavaScript — safer than `localStorage` against XSS.
- `SameSite=Lax` reduces CSRF risk.
- `credentials: "include"` on `fetch` + `credentials: true` on CORS are
  both required for cookie-based auth across origins.
- `GET /api/auth/me` is how the frontend learns whether a page refresh
  dropped the user back into a logged-in state.
- Authentication ("who are you?") is separate from authorization
  ("what are you allowed to do?") — that's Week 7.
