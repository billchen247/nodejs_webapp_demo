# Week 8 — Teaching Notes

## Learning goals

- Students can describe when and why to use React Context.
- Students can write a `useAuth` custom hook.
- Students can build a `ProtectedRoute` wrapper.
- Students can use `NavLink`, `Navigate`, `useNavigate`, `useLocation`.
- Students can explain why client-side route guards are *not* security.

## Core concepts

### Context

A context lets any descendant of a provider read or update shared state
without passing props through every intermediate component. Perfect for:

- Current user / auth state
- Theme (light/dark)
- Feature flags

We expose a `useAuth()` hook so components don't have to know about the
underlying `AuthContext`.

### Routing with React Router

- `<BrowserRouter>` wraps the app and syncs with the URL.
- `<Routes>` + `<Route>` map URL paths to components.
- `<NavLink>` is like `<Link>` but reflects "I am active".
- `<Navigate to="…" replace />` performs a redirect.
- `useNavigate()` is the imperative equivalent.
- `useLocation()` exposes the current URL and any `state` passed on
  navigation (we use it to remember "where was I going?").

### ProtectedRoute

```jsx
if (loading) return <Spinner />;
if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
return children;
```

After login, we read `location.state.from` and send the user back there.

### Startup flow

```
mount → loading=true → GET /me → user | null → loading=false → render routes
```

If we skipped the loading step, every refresh would briefly show the
anonymous UI before switching to the authenticated UI. That flicker
confuses users.

### Hiding is not security

- Hiding `/admin` from the nav bar does NOT prevent a user from typing
  it in the address bar.
- Even if they get there, the API refuses to return admin data.
- **Rule**: the backend is the fortress. The frontend is a reception desk.

## Common student questions

**Why does `useAuth` throw if used outside the provider?**
Because the context value is `null` by default, which would otherwise
produce a confusing "cannot read property … of null" error later. We
fail fast with a readable message.

**Why doesn't the UI flash anonymous content on refresh?**
Because `ProtectedRoute` returns a loading view until `GET /me` resolves.

**Where should I put error handling for 401 from `taskService`?**
Both in the component (to redirect) and inside the service (status is
on `err.status`). We handle it in `TasksPage.handle(...)` so each
mutation goes through one place.

**Should I store the user in `localStorage` for faster startup?**
Not necessary. `GET /me` is a single request and keeps the client
truthful about the real server-side session.
