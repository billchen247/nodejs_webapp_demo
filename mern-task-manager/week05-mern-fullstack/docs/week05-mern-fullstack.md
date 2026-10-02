# Week 5 — Teaching Notes

## Learning goals

- Students can call a REST API from React using `fetch`.
- Students can describe CORS and why it exists.
- Students can model loading, error, and empty UI states.
- Students can keep network code in a service module.
- Students can trace a round-trip: UI → API → Mongoose → MongoDB → UI.

## Core concepts

### `fetch`

Browser-native HTTP client:

```js
const res = await fetch(url, { method, headers, body });
const data = await res.json();
if (!res.ok) throw new Error(data.error);
```

`fetch` **does not throw** on 4xx/5xx — we check `res.ok` ourselves.

### Service layer

`client/src/services/taskService.js` wraps `fetch`. Benefits:

- Components don't repeat URL strings.
- One place to add auth, retries, interceptors later.
- The `Home` component becomes a pure state machine.

### CORS

The browser enforces the Same-Origin Policy. When `http://localhost:5173`
calls `http://localhost:5000`, the browser requires the server to opt
in with the right `Access-Control-Allow-Origin` header. The `cors`
middleware adds those headers; we scope it to `CLIENT_URL`.

> `cors()` with no args uses `*`, which is OK for public APIs but
> disallowed once we send credentials (cookies in Week 7+). We enable
> `credentials: true` now so we don't need to change this again later.

### UI states

| State    | Shown when                                           |
| -------- | ---------------------------------------------------- |
| loading  | Fetching initial data.                               |
| error    | A request failed; show the message and let the user retry (refresh). |
| empty    | Fetched successfully but zero tasks.                 |
| ready    | Normal list of tasks.                                |

### `useEffect`

```jsx
useEffect(() => {
  // runs after render
  return () => {
    // optional cleanup
  };
}, [deps]);
```

- `[]` → run once after mount.
- `[a, b]` → run when `a` or `b` changes.
- No array → run after every render (rarely what you want).

### Dev vs. production

In development the Vite dev server (`:5173`) and the Express API
(`:5000`) are two separate processes. In production you would usually
either:

- Serve the built React app from Express.
- Deploy them to two services and have the frontend call the backend by URL.

Both approaches use the same code. The `VITE_API_URL` env var controls which URL.

## Common student questions

**Why doesn't `fetch` throw on 404?**
Because `fetch` only rejects on **network** failures. HTTP errors are
*successful responses*; we have to inspect `response.ok`.

**Why does CORS fail even if the server returned 200?**
The browser blocks reading the response if the headers aren't right.
The server did its job; the browser is being strict for your safety.

**Why `_id` and not `id`?**
MongoDB documents have an `_id` field (an ObjectId). We use it as the
React key and in the service URLs.

**Why does editing one task sometimes feel laggy?**
Because the UI waits for the server round-trip. Optimistic updates
(update local state first, revert on error) are a common optimization
students can explore on their own.
