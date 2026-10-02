# Week 5 — Full MERN Integration

## Learning objectives

By the end of this week a student can:

- Explain, in their own words, what the browser's same-origin policy is
  and why CORS exists.
- Configure the `cors` Express middleware for a single trusted origin.
- Build a React `services/api.ts` layer around `fetch` with typed errors.
- Render a UI that correctly handles **loading**, **error**, and **ready**
  states for a networked data source.
- Write Vitest tests that mock a service layer, and separately pin the
  exact HTTP request shape by stubbing `fetch`.

---

## Why CORS?

Browsers treat `http://localhost:5173` (Vite) and `http://localhost:3000`
(Express) as different "origins". Without CORS headers, a page served
from one may not read responses from the other. This is a **security**
feature of the browser, not a feature of the server — the server has no
way to know a request came from a page running in a browser at all.

We opt in with `cors({ origin: CLIENT_URL })`. We deliberately avoid
`cors()` with no arguments (`*`) because:

- Week 6 will introduce authentication cookies, which browsers refuse to
  send to wildcard origins.
- Reading the config and seeing the actual allowed origin written down is
  more honest than hiding it behind a default.

---

## Why a service layer?

A React component that calls `fetch` directly becomes:

- Hard to test without a stub.
- Hard to migrate (e.g., swap `fetch` for `axios`, or add retries).
- Full of boilerplate that distracts from what the component is for.

`services/api.ts` solves all three by owning:

- The base URL.
- Content-Type headers.
- Response parsing.
- Error normalisation (`ApiError`).
- The verb and path for each operation.

Components ask for data in domain terms (`api.listTasks()`), and get
either a typed value or a typed error.

---

## Why non-optimistic updates?

Week 5 waits for the server's response before updating state. An
"optimistic" variant would update the UI immediately and roll back on
error. Both are valid; the honest "wait then refresh" flow is clearer
for teaching because:

- The classroom can watch the request-response round-trip in DevTools.
- Rollback logic for an optimistic update is a non-trivial second lesson.
- Any bug is in exactly one place — the service layer — not spread
  across two code paths (optimistic + reconcile).

---

## Why three UI states (loading / error / ready)?

A UI that only handles the happy path:

- Shows nothing while the first request is in flight (students mistake it
  for "the app is broken").
- Silently fails on network errors.
- Keeps stale data when the user re-opens the tab after an API outage.

A well-designed UI treats every data source as having **at least** three
states. Week 5 implements all three for `Home`:

- `loading`: shown on first mount and on every refresh. A `role="status"`
  element announces it to screen readers.
- `error`: shown when the service rejects. A `role="alert"` banner with a
  retry button. Children keep whatever they had before so the user is
  not "jumped back to blank".
- `ready`: the normal list rendering path.

---

## Testing strategy

Two layers, each tested with a different style:

1. **Service layer (`client/tests/api.test.ts`)**
   - Stub `globalThis.fetch`.
   - Assert on exact URL, method, headers, body.
   - Assert that non-2xx responses throw `ApiError` with the right status
     and message.
   - This is where regressions in the HTTP contract get caught.

2. **UI (`client/tests/Home.test.tsx`)**
   - `vi.mock("../src/services/api.js", …)` so the service is a stub.
   - Simulate the user: type, click, filter, retry.
   - Assert that the right API method was called with the right args.
   - This is where React behaviour is pinned without re-testing fetch.

The two files complement each other. If `Home.test.tsx` broke but
`api.test.ts` still passed, the regression is in React code. If
`api.test.ts` broke, the HTTP contract shifted. That split keeps
diagnosis fast.

---

## Checklist for the week

- [ ] CORS allows exactly one configured origin.
- [ ] A disallowed origin receives no `Access-Control-Allow-Origin` header.
- [ ] OPTIONS pre-flight is answered by the middleware.
- [ ] `services/api.ts` is the only module that calls `fetch`.
- [ ] `ApiError` carries `status`, `body`, and a human message.
- [ ] `Home` renders a loading indicator on first mount.
- [ ] `Home` renders a retriable error banner on service failure.
- [ ] `VITE_API_URL` is honoured and defaults to `http://localhost:3000`.
- [ ] Both test suites green.
