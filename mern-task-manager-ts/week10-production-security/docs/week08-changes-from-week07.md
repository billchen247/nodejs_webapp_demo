# Changes from Week 7 → Week 8

## New dependency

- `react-router-dom@^6.26.0` on the client.

## New files

- `client/src/context/AuthContext.tsx` — provider + `useAuth()` hook.
- `client/src/components/ProtectedRoute.tsx` — redirects to `/login`
  when the user isn't authenticated.
- `client/src/components/NavBar.tsx` — persistent auth bar extracted
  from `App.tsx`.
- `client/tests/ProtectedRoute.test.tsx` — focused tests for the guard.

## Modified files

- `client/src/App.tsx`
  - Replaces the hand-rolled "if user then Home else Login/Register"
    switch with `<Routes>`.
  - Mounts `<AuthProvider>` once at the top.
  - No longer owns `user` state — `AuthContext` does.
- `client/src/main.tsx` — wraps `<App />` in `<BrowserRouter>`.
- `client/src/pages/Login.tsx`
  - Drops the `onAuthenticated` / `onSwitchToRegister` props.
  - Reads `useAuth()`, `useNavigate()`, and `useLocation()`.
  - Preserves `location.state.from` so deep links survive the bounce.
- `client/src/pages/Register.tsx` — same pattern as Login.
- `client/tests/App.test.tsx` — rendered inside `<MemoryRouter>`.
- `client/tests/Auth.test.tsx` — rewritten; mounts pages in a
  `MemoryRouter` + `AuthProvider`.
- `client/package.json` — adds `react-router-dom`; name/description bump.
- `server/package.json` — name/description bump only. Server code is
  unchanged.

## No server-code changes

The backend already requires auth and scopes tasks by owner (Week 7).
This week is a frontend-only improvement. If the Week 7 tests pass,
the server half of Week 8 passes.
