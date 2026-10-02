# Week 8 — Changes from Week 7

## What We Had Before

- Server: fully protected tasks API, per-user ownership.
- Client: a single page `Home.jsx`, state owned in `App.jsx`, no routing.
- `user` and callbacks passed via props to `Home` and `NavBar`.

## What We Added

### Client
- `src/context/AuthContext.jsx` — provider + `useAuth` hook.
- `src/components/routes/ProtectedRoute.jsx`.
- `src/pages/HomeLanding.jsx` + `.css` — public landing.
- `src/pages/Dashboard.jsx` + `.css` — authenticated splash.
- `react-router-dom` as a dependency.

## What We Changed

- `main.jsx` — wraps the app in `<BrowserRouter>` and `<AuthProvider>`.
- `App.jsx` — now a `<Routes>` tree.
- `NavBar.jsx` — uses `NavLink` and reads from `useAuth`.
- `Login.jsx` / `Register.jsx` — use `useAuth` and `useNavigate`;
  after success, navigate to the saved `from.pathname` or `/tasks`.
- `pages/Home.jsx` → `pages/TasksPage.jsx` (renamed), updated to use
  `useAuth` and `useNavigate` for 401 handling.
- `pages/Home.css` → `pages/TasksPage.css` (renamed), class prefix updated.
- `index.html` title updated to Week 8.
- `README.md` describes the new routing architecture.

## Files Added

- `client/src/context/AuthContext.jsx`
- `client/src/components/routes/ProtectedRoute.jsx`
- `client/src/pages/HomeLanding.jsx` + `.css`
- `client/src/pages/Dashboard.jsx` + `.css`
- `docs/week08-react-authentication.md`
- `docs/week08-changes-from-week07.md`

## Files Renamed

- `client/src/pages/Home.jsx` → `TasksPage.jsx`
- `client/src/pages/Home.css` → `TasksPage.css`

## Files Modified

- `client/package.json` — added `react-router-dom`.
- `client/src/main.jsx` — Router + AuthProvider.
- `client/src/App.jsx` — Routes tree.
- `client/src/components/NavBar.jsx` — reads context, uses NavLink.
- `client/src/pages/Login.jsx` + `Register.jsx` — use `useAuth`.
- `client/index.html` — title.
- `README.md`.

## Dependencies Added

Client: `react-router-dom`

## Architecture Change

```
Week 7                                 Week 8
-------                                -------
single-page view with App switch    →  BrowserRouter + <Routes>
user state in App.jsx               →  AuthContext (anywhere)
hand-rolled protected view          →  <ProtectedRoute>
no deep links                       →  deep links: /tasks, /dashboard, ...
```

## New Concepts

- React Context + custom hooks.
- `BrowserRouter`, `Routes`, `Route`, `NavLink`, `Navigate`.
- `useNavigate`, `useLocation`.
- Client-side route guards vs. server-enforced access.
- Session bootstrapping (`loading` → `GET /me` → render).

## Why We Made These Changes

Real applications have multiple pages. Prop drilling `user` and
`onLogout` all over the tree becomes painful as the UI grows. Context
and routing are the two pieces of React every student will need in
every job — introducing them here, after the auth concepts, keeps the
teaching order honest.

## Classroom Demonstration

1. Visit `/`, then `/tasks` without logging in → redirected to `/login`.
2. Log in → React Router sends you back to `/tasks`.
3. Click Dashboard → see the welcome. Click Tasks → see the list.
4. Click Logout → both protected routes become inaccessible, nav bar
   flips to anonymous.
5. Delete the cookie manually in DevTools → refresh → protected routes
   send you back to login.
6. Discuss what the server does differently when the cookie disappears
   (returns 401 — the actual gate).
