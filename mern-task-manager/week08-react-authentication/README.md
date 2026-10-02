# Week 8 — React Authentication

## What this week teaches

> **Can React know who is logged in?**

We teach the frontend to understand authentication:

- A **React Context** (`AuthContext`) that exposes `user`, `loading`,
  `isAuthenticated`, `login`, `register`, `logout`, `refreshUser`.
- **React Router** for real URLs: `/`, `/login`, `/register`,
  `/dashboard`, `/tasks`.
- A `ProtectedRoute` component that redirects anonymous users to
  `/login` and remembers where they were going.

> **The frontend hides routes. The server actually enforces access.**
> Hiding is not security. The server from Week 7 is still what protects
> your data.

## What changed from Week 7

### Client
- New `src/context/AuthContext.jsx` with provider + `useAuth` hook.
- New `src/components/routes/ProtectedRoute.jsx`.
- New routed pages:
  - `HomeLanding.jsx` — public home page `/`.
  - `Dashboard.jsx` — authenticated at `/dashboard`.
  - `TasksPage.jsx` — authenticated at `/tasks` (renamed from `Home.jsx`).
- `NavBar.jsx` uses `NavLink` and reads auth state from context.
- `Login.jsx` / `Register.jsx` use `useAuth` and `useNavigate`; after
  login they redirect to the originally requested page.
- `App.jsx` is now a `Routes` tree.
- `main.jsx` wraps the app in `<BrowserRouter>` and `<AuthProvider>`.
- Added `react-router-dom`.

### Server
No changes. Week 7's protected API is still exactly correct.

## Install

```bash
cd week08-react-authentication/server && npm install
cd ../client && npm install
```

## Configure `.env`

Unchanged from Weeks 6–7. See `server/.env.example` and `client/.env.example`.

## Run

```bash
cd week08-react-authentication/server && npm run dev
cd week08-react-authentication/client && npm run dev
```

## Routes

| Path          | Public? | Component          |
| ------------- | ------- | ------------------ |
| `/`           | yes     | `HomeLanding`      |
| `/login`      | yes     | `Login`            |
| `/register`   | yes     | `Register`         |
| `/dashboard`  | no      | `Dashboard`        |
| `/tasks`      | no      | `TasksPage`        |
| `*`           | yes     | redirect to `/`    |

## API endpoints

Unchanged. See Week 7 README.

## Important files

```
week08-react-authentication/
├── server/                                  # unchanged
└── client/src/
    ├── main.jsx                              # BrowserRouter + AuthProvider
    ├── App.jsx                               # <Routes>
    ├── context/
    │   └── AuthContext.jsx                   # NEW
    ├── components/
    │   ├── NavBar.jsx                        # uses NavLink + useAuth
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx            # NEW
    │   ├── TaskForm.jsx
    │   ├── TaskList.jsx
    │   └── TaskItem.jsx
    ├── pages/
    │   ├── HomeLanding.jsx                   # NEW landing /
    │   ├── Dashboard.jsx                     # NEW /dashboard
    │   ├── TasksPage.jsx                     # renamed from Home.jsx (/tasks)
    │   ├── Login.jsx                         # useAuth + useNavigate
    │   └── Register.jsx                      # useAuth + useNavigate
    └── services/
        ├── taskService.js
        └── authService.js
```

## New dependencies

Client:
| Package              | Why |
| -------------------- | --- |
| `react-router-dom`   | URL-based routing. |

## Architecture

```
BrowserRouter
   └── AuthProvider
        ├── <NavBar> (reads user from context)
        └── <Routes>
             ├── /
             ├── /login
             ├── /register
             ├── /dashboard   ← ProtectedRoute
             ├── /tasks       ← ProtectedRoute
             └── *            ← redirect
```

Startup sequence:

```
AuthProvider mounts
    │
    ├── loading = true
    ├── fetch /api/auth/me
    │     ├── 200 → user populated
    │     └── 401 → user = null
    └── loading = false  → routes render
```

## Suggested classroom demonstration

1. Open `http://localhost:5173`. You land on the public home.
2. Click "Sign up". Register. React Router sends you to `/tasks`.
3. Copy the URL. Open an incognito window and paste the URL. The
   `ProtectedRoute` redirects you to `/login`. After signing in, you
   land back on `/tasks` thanks to the saved `from.pathname`.
4. In DevTools → Application → Cookies, delete the `token` cookie,
   then hit refresh. The nav bar flips to anonymous and `/tasks`
   redirects to `/login`.
5. In DevTools Console, with the token deleted, try:
   ```js
   await fetch("http://localhost:5000/api/tasks", { credentials: "include" }).then((r) => r.status);
   ```
   → **401**. The server is the real security boundary.
6. Reload the page while logged in — `AuthProvider` calls `GET /me` on
   mount and restores the user. No visible flash.

## What students should understand after the lesson

- **Context** is the right place for "shared, cross-cutting" state like
  the current user.
- **Routes** map URL paths to components; URL changes update the UI.
- **ProtectedRoute** is a tiny wrapper that redirects anonymous users.
- Client-side route guards are a **UX** feature; the API from Week 7 is
  what actually protects data.
- The JWT still never leaves the HTTP-only cookie. We never read it from
  JavaScript, we never store it in `localStorage`.
- On a page refresh, we rediscover the session via `GET /api/auth/me`.
