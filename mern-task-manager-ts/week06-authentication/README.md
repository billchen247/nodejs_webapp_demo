# Week 6 — Authentication

> **Question of the week:** *How does the server know who you are?*

Week 5 wired the React UI to the Express API. Week 6 adds a User model,
password hashing with bcrypt, and session management via a signed **JWT
delivered in an HTTP-only cookie**. The client gains Register and Login
pages, and an auth bar across the top with a Logout button.

Tasks are still public this week — anybody can read, create, update,
delete them. Protecting the task API, and letting users own their own
tasks, is Week 7.

---

## What this week teaches

- Why we store password hashes, not passwords, and why bcrypt in
  particular (built-in salt, tunable cost).
- JWTs: what they are, why pinning `HS256` matters, and when to prefer
  cookies over `Authorization: Bearer` headers.
- HTTP-only, SameSite=lax, secure-in-prod cookies and the XSS/CSRF
  trade-offs they manage.
- CORS with `credentials: true`, and the matching `fetch` flag
  `credentials: "include"`.
- Keeping credentials off the response body (`select: false` on the
  password hash, `toJSON` transform drops it anyway).
- Returning the **same** 401 for "unknown email" and "wrong password",
  to avoid user-enumeration leaks.
- A React auth flow with login / register / logout, no routing library
  yet (Week 8 brings React Router).

---

## New files

```
server/
  src/
    auth/
      cookie.ts            # set / clear the HTTP-only cookie
      jwt.ts               # sign / verify HS256 JWTs
    controllers/
      authController.ts    # register / login / logout / me
    models/
      User.ts              # email + passwordHash, bcrypt helpers
    routes/
      authRoutes.ts
  tests/
    authApi.test.ts        # 14 integration tests

client/
  src/
    pages/
      Login.tsx
      Register.tsx
      AuthForm.css
  tests/
    Auth.test.tsx
    App.test.tsx
```

---

## Installation

```bash
cd week06-authentication
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env and set JWT_SECRET to a long random string
```

---

## Running

```bash
# Terminal 1 — API on http://localhost:3000
npm run dev:server

# Terminal 2 — React dev server on http://localhost:5173
npm run dev:client
```

Open http://localhost:5173:

1. The app loads, asks `/api/auth/me`, discovers no session, shows Login.
2. Click "Need an account? Register" and create one. The server sets
   the auth cookie and returns the user — you land on the task page.
3. Reload the page. `/me` finds the cookie, you stay signed in.
4. Click Log out — the cookie clears, you are back on the login form.

Open DevTools → Application → Cookies. The `mern_task_manager_auth`
cookie is marked HttpOnly, SameSite=Lax, with a 7-day expiry.

---

## Running tests

```bash
npm run test             # server, then client
npm run test:server      # 39 tests: tasks + auth + CORS
npm run test:client      # 34 tests: components + api + auth + App
```

---

## New dependencies

Server:

- `bcrypt` + `@types/bcrypt` — password hashing with per-user salt.
- `jsonwebtoken` + `@types/jsonwebtoken` — signed tokens.
- `cookie-parser` + `@types/cookie-parser` — read `req.cookies`.

Client: none new.

---

## New environment variables

| Variable      | Scope  | Purpose                                   |
| ------------- | ------ | ----------------------------------------- |
| `JWT_SECRET`  | server | HS256 signing secret, 32+ chars required. |

---

## Suggested classroom demonstration

1. Register a user through the UI. Then open MongoDB (Compass or
   `mongosh`) and show that the `users` collection stores a bcrypt
   hash, never the password.
2. In DevTools, show the Set-Cookie header on `/api/auth/register`.
   Point out `HttpOnly`, `SameSite=Lax`.
3. Try `document.cookie` in the console. The auth cookie does **not**
   appear — JavaScript cannot see HTTP-only cookies.
4. Delete the cookie in DevTools and refresh. The app returns to the
   login screen.
5. Log in with a wrong password and show the server returns the exact
   same message as logging in with a wrong email.

---

## What students should understand after this lesson

- The server never sees plain passwords after the first POST — only
  bcrypt hashes.
- Sessions can be stateless (the JWT contains the user id) without
  being less secure, if the token is kept out of reach of page
  JavaScript (via HTTP-only cookies).
- Browsers only attach cookies on cross-origin requests when both the
  server opts in (`credentials: true`) and the client opts in
  (`credentials: "include"`).
- A good login flow protects against user enumeration by returning the
  same error for every kind of credential failure.
