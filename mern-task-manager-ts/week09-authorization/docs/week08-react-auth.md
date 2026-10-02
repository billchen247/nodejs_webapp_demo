# Week 8 — React Authentication

## Learning objectives

By the end of this week a student can:

- Explain *why* AuthContext exists (prop drilling vs. shared cross-cutting
  state) and when context is overkill.
- Build a `createContext` + `Provider` + `useX()` triplet in TypeScript,
  including a sensible "used outside provider" error.
- Set up React Router v6 at the application root and inside a test
  suite, understanding the `BrowserRouter` vs `MemoryRouter` split.
- Write a `ProtectedRoute` wrapper that handles three cases: loading,
  authenticated, and unauthenticated.
- Preserve the attempted URL through the login bounce using
  `<Navigate state={{ from: location }}>` and reading `location.state`
  on the other side.

---

## The AuthContext shape

```ts
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;            // true until the first /me resolves
  login: (input) => Promise<void>;
  register: (input) => Promise<void>;
  logout: () => Promise<void>;
}
```

A design we deliberately did NOT ship: exposing `setUser` directly.
That would let any component overwrite the user without consulting the
API — a short, decentralised path to inconsistency. Routing all writes
through `login`, `register`, and `logout` keeps the API call and the
state update co-located.

## The three states of ProtectedRoute

1. **Loading** — we have not finished asking `/me` who we are. Render
   a spinner (or a status line). This is the step that would otherwise
   cause a split-second "login" flash for an actually-authenticated
   user on first page load.
2. **Unauthenticated** — redirect to `/login` with `replace` and stash
   the attempted location in `state.from`.
3. **Authenticated** — render children.

Teaching tip: ask students to deliberately omit the loading state and
reload the page while logged in. The visible flash is the lesson.

## Deep-link preservation

```tsx
// in ProtectedRoute:
<Navigate to="/login" replace state={{ from: location }} />

// in Login:
const from = (location.state as { from?: Location })?.from?.pathname ?? "/tasks";
await login({ email, password });
navigate(from, { replace: true });
```

The `replace` on both ends keeps the browser history clean: a user
who hits "back" after being redirected to login does not loop between
`/tasks` and `/login`. The `from` round-trip means a shared link like
`/tasks` is still useful even if the recipient isn't signed in — they
get bounced through login and end up where they expected.

## Testing routing

Two important ideas:

- **MemoryRouter in tests, BrowserRouter in production.** They implement
  the same interface against different history stacks. In production
  we want real URLs; in tests we want per-case initial routes without
  touching `window.location`.
- **Mount `<App />` without a surrounding router.** If `App.tsx` itself
  mounted `<BrowserRouter>`, tests that wrap it in `<MemoryRouter>`
  would silently nest two routers and route transitions would misbehave.
  We put the production router in `main.tsx` for exactly this reason.

## Why not Zustand/Redux/Jotai?

For a single piece of auth state and three actions, context is enough.
Teaching an external store before context would also obscure the
language-level mechanism — context is what powers most of those
libraries internally. Reach for a store when:

- State needs middleware (persistence, logging, time-travel).
- Many unrelated consumers want slices of the same data without
  re-rendering siblings.
- The app has grown past a handful of context providers nested like
  Russian dolls.

None of those applies to a two-page task manager.
