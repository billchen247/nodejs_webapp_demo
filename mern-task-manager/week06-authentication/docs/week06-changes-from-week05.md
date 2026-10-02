# Week 6 — Changes from Week 5

## What We Had Before

- Full MERN application.
- Public `tasks` API — anyone could create, read, update, or delete.
- No notion of users.
- No cookies, no JWT, no password handling.

## What We Added

### Server
- `User` Mongoose model with `email` (unique) and `passwordHash` (`select: false`).
- A `.toSafeJSON()` method so we never accidentally send `passwordHash` or `__v`.
- `src/config/auth.js` — `signAuthToken`, `verifyAuthToken`, `AUTH_COOKIE_NAME`, `authCookieOptions`.
- `authController` with `register`, `login`, `logout`, `me`.
- `authRoutes` mounted at `/api/auth`.
- `cookie-parser` middleware so `req.cookies` is populated.
- `bcrypt` with 12 rounds for password hashing.
- `jsonwebtoken` for signing and verifying tokens.

### Client
- Shared `request()` helper now includes `credentials: "include"`.
- `authService.js` wraps `/api/auth/*`.
- `Login.jsx`, `Register.jsx`, `AuthForm.css` — accessible forms with
  loading and error states.
- `NavBar.jsx` — context-aware navigation (login/sign up when anonymous,
  user greeting + logout when authenticated).
- `App.jsx` — owns `user`, bootstraps with `GET /api/auth/me`, controls
  which view is visible.
- `Home.jsx` now accepts a `user` prop and shows a status hint.

## What We Changed

- `server/src/server.js` — mounted `/api/auth`, added `cookieParser()`.
- `server/.env.example` — added `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`.
- `client/src/services/taskService.js` — extracted `request()` and
  enabled cookies for all requests.
- `client/src/App.jsx` and `client/src/App.css` — new app shell.
- `index.html` title updated to Week 6.

## Files Added

- `server/src/models/User.js`
- `server/src/config/auth.js`
- `server/src/controllers/authController.js`
- `server/src/routes/authRoutes.js`
- `client/src/services/authService.js`
- `client/src/pages/Login.jsx`
- `client/src/pages/Register.jsx`
- `client/src/pages/AuthForm.css`
- `client/src/components/NavBar.jsx`
- `client/src/components/NavBar.css`
- `docs/week06-authentication.md`
- `docs/week06-changes-from-week05.md`

## Files Modified

- `server/package.json`
- `server/.env.example`
- `server/src/server.js`
- `client/src/services/taskService.js`
- `client/src/App.jsx` / `App.css`
- `client/src/pages/Home.jsx` / `Home.css`
- `client/index.html`
- `README.md`

## Dependencies Added

Server:
- `bcrypt`
- `jsonwebtoken`
- `cookie-parser`

## Architecture Change

```
Week 5                              Week 6
-------                             -------
one anonymous API                 → anonymous + authenticated endpoints
no users collection               → users collection (bcrypt hashes)
no cookies                        → HttpOnly auth cookie
single Home view                  → Home / Login / Register
no server-aware navigation        → NavBar reflects auth state
```

## New Concepts

- Password hashing (bcrypt).
- JWTs — payload + signature + secret.
- HTTP-only cookies, `SameSite`, `Secure`, `maxAge`.
- CORS with `credentials: true` + `fetch` with `credentials: "include"`.
- `GET /me` as the "am I still logged in?" probe on page load.
- `.select: false` and `.select("+field")` to protect sensitive fields.
- Shaping responses with a safe serializer method.

## Why We Made These Changes

Without a notion of "who is making this request", we cannot have private
data. Introducing authentication cleanly, with the correct cookie-based
pattern, sets up Weeks 7 (ownership), 8 (React auth context + routes),
9 (roles), and 10 (production hardening).

## Classroom Demonstration

1. Register a user from the UI. Point out:
   - the cookie in DevTools → Application → Cookies.
   - the user document in Compass with `passwordHash` (not plaintext).
2. Refresh the page. The user is still signed in — the cookie carried the JWT.
3. Click Logout. Refresh. Back to anonymous.
4. Try to log in with the wrong password — show the generic 401.
5. From the terminal, repeat the flow with `curl -c/-b` and show
   that it behaves identically.
6. Discuss: why not `localStorage`?
