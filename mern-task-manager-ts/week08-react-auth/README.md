# Week 8 — React Authentication

> **Question of the week:** *How do you handle authenticated users in a
> React app without threading state through every component?*

Week 6 wired up login + logout at the component level — App held the
user and passed callbacks down. That worked, but it was fragile: every
page that cared about auth had to be plumbed in by hand, and the URL
and the UI drifted apart (you were "logged in" but the address bar
still said `/`).

Week 8 fixes both:

1. **AuthContext** — a single provider holds `{ user, login, register,
   logout }`. Any page can call `useAuth()` to read or act on it.
2. **React Router** — real URL-based routing. `/login`, `/register`,
   `/tasks`.
3. **ProtectedRoute** — a tiny wrapper that redirects to `/login` and
   remembers where the user was trying to go.

Server code is unchanged — the backend already stamps the cookie and
protects the API; this week is purely about the frontend.

---

## What this week teaches

- Why context beats prop-drilling for cross-cutting state like auth.
- Writing a Context + Provider pair in TypeScript, with a hook that
  throws when used outside the provider.
- Declarative routing with React Router v6: `<Routes>`, `<Route>`,
  `<Navigate replace>`.
- The "protected route" pattern — guarding a tree based on async state
  without flashing the wrong page.
- Deep-link preservation: a user who pastes `/tasks` while logged out
  lands on `/tasks` after signing in, not on `/`.
- Keeping `<BrowserRouter>` in `main.tsx` and using `<MemoryRouter>` in
  tests, so the test suite can set the initial URL per test.

---

## New files

- `client/src/context/AuthContext.tsx` — the provider + `useAuth()` hook.
- `client/src/components/ProtectedRoute.tsx` — route guard.
- `client/src/components/NavBar.tsx` — persistent auth bar.
- `client/tests/ProtectedRoute.test.tsx` — new test file for the guard.

## Changed files

- `client/src/App.tsx` — now routes with React Router instead of
  rendering by `if (user)` branches.
- `client/src/main.tsx` — wraps `<App />` in `<BrowserRouter>`.
- `client/src/pages/Login.tsx` + `Register.tsx` — no longer take
  callback props; use `useAuth()` + `useNavigate()` instead.
- `client/tests/App.test.tsx` — rendered inside `<MemoryRouter>`.
- `client/tests/Auth.test.tsx` — rewritten for the new API.
- `client/package.json` — adds `react-router-dom`.

Server: no code changes.

---

## Installation

```bash
cd week08-react-auth
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env and set JWT_SECRET to a long random string
```

## Running

```bash
npm run dev:server    # http://localhost:3000
npm run dev:client    # http://localhost:5173
```

Try these in a browser to feel the routing:

- Open `/tasks` while signed out → you land on `/login`, URL updates.
- Log in → you jump straight back to `/tasks` (the URL you asked for).
- Open `/register` → the form appears, URL says `/register`.
- Hit the back button after being redirected → you don't ping-pong.

## Testing

```bash
npm run test:server   # 38 tests, unchanged
npm run test:client   # 36 tests
```

---

## Suggested classroom demonstration

1. In the browser, visit `/tasks` while logged out. Point out that the
   URL bar changes to `/login` but the login form is wearing exactly
   the state we want.
2. Submit the login form. The URL jumps to `/tasks`.
3. Click Log out. The URL jumps to `/login`.
4. Open DevTools → Application → Cookies. Point out the single
   `mern_task_manager_auth` cookie that the server set. Delete it,
   reload — you are logged out immediately.
5. Try pasting `/tasks` into the address bar while logged out. Log in.
   Watch the user land on `/tasks` (not `/`).

---

## What students should understand after this lesson

- **Context is a tool, not a pattern language**. You reach for it when
  state is "owned" by the app itself (current user, theme, locale) and
  consumed by components anywhere in the tree. For local widget state,
  plain `useState` is still right.
- **Routing is a UI concern** that happens to touch the URL. The URL
  is a public API for your app — it should be shareable, bookmarkable,
  and consistent with what is rendered.
- **ProtectedRoute is five lines of logic** but it is where most
  "I'm logged in but the UI says I'm not" bugs live. Reading `/me` on
  mount and *waiting for it* before redirecting is the whole trick.
