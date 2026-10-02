# Week 5 — Changes from Week 4

## What We Had Before

- `server/` — Express + MongoDB (same as Week 3), no CORS, no client usage.
- `client/` — React UI using **mock data** in `useState`.
- The two never talked to each other.

## What We Added

### Server
- `cors` middleware, scoped to `CLIENT_URL`.
- `CLIENT_URL` in `.env.example`.
- `server/src/middleware/` directory, empty for now (used in Week 7).

### Client
- `services/taskService.js` — a `fetch` wrapper exposing
  `list / get / create / update / remove`.
- Loading state in `Home`.
- Error banner in `Home`.
- Fetching on mount with `useEffect`.
- `VITE_API_URL` in `.env.example`.

## What We Changed

- `Home.jsx` is now async: it fetches on mount and awaits every mutation.
- `TaskList.jsx` and `TaskItem.jsx` use `task._id` (MongoDB) instead of `task.id`.
- The header subtitle and page title reflect Week 5.
- The footer no longer says "data is not persisted" — now it is.

## Files Added

- `client/src/services/taskService.js`
- `client/.env.example`
- `server/src/middleware/` (empty)
- `docs/week05-mern-fullstack.md`
- `docs/week05-changes-from-week04.md`

## Files Modified

- `server/package.json` — added `cors`.
- `server/.env.example` — added `CLIENT_URL`.
- `server/src/server.js` — added CORS middleware.
- `client/package.json` — bumped description.
- `client/src/pages/Home.jsx` — rewritten for API.
- `client/src/pages/Home.css` — added loading + error styles.
- `client/src/components/TaskList.jsx` — `_id` key.
- `client/src/components/TaskItem.jsx` — `_id` for handlers.
- `client/src/App.jsx` + `client/index.html` — Week 5 labels.
- `README.md`

## Dependencies Added

Server: `cors`

## Architecture Change

```
Week 4                              Week 5
-------                             -------
React (mock data)                 → React → fetch → Express
Express exists but is unused      → Express is now called by React
no CORS                           → explicit CORS with CLIENT_URL
UI loses data on refresh          → UI reloads from MongoDB on refresh
```

## New Concepts

- `fetch` and HTTP from the browser.
- Service layer pattern.
- CORS and the Same-Origin Policy.
- `useEffect` for data fetching.
- Loading / error UI states.
- Vite env variables (`VITE_` prefix).
- MongoDB `_id` on the client.

## Why We Made These Changes

The whole point of MERN is the stack. Week 4 taught React in isolation
so students didn't have to debug both React *and* HTTP at once. Now the
UI uses the real API and real database — exactly the shape of a
production app.

## Classroom Demonstration

1. Open MongoDB Compass and both terminals (server + client).
2. Add a task in the UI → watch it appear in Compass immediately.
3. Modify a task directly in Compass → refresh the UI → see the change.
4. Stop the server mid-session → add a task in UI → see the error state.
5. Restart the server → refresh UI → data is back.
6. Look at the Network tab in DevTools. Show the OPTIONS pre-flight
   request CORS does for mutating methods.
