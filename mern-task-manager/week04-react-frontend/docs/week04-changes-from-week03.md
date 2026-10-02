# Week 4 — Changes from Week 3

## What We Had Before

- Backend-only project: Express + MongoDB + Mongoose at the project root.
- `src/` held `server.js`, `models/`, `routes/`, `controllers/`, `config/`.
- No UI; interaction was through curl / Postman / Compass.

## What We Added

- A separate **React frontend** in `client/`.
- A Vite-based React setup (`vite.config.js`, `index.html`, `main.jsx`).
- Components: `App`, `Home`, `TaskForm`, `TaskList`, `TaskItem`.
- Modern plain CSS with:
  - CSS custom properties (variables)
  - Flexbox + CSS Grid layouts
  - `clamp()` for responsive type
  - `:focus-visible` and `accent-color` for accessibility
  - A `@media (max-width: 540px)` rule for mobile
- Local, in-memory state inside React (`useState`) with mock data.

## What We Changed

- The entire backend was **moved into `server/`** — content unchanged.
- A single top-level `.gitignore` covers both subprojects.
- The weekly README now documents two independent workflows (server + client).

## Files Added

- `client/package.json`
- `client/vite.config.js`
- `client/index.html`
- `client/src/main.jsx`
- `client/src/App.jsx`, `client/src/App.css`
- `client/src/index.css`
- `client/src/pages/Home.jsx`, `client/src/pages/Home.css`
- `client/src/components/TaskForm.jsx`, `.css`
- `client/src/components/TaskList.jsx`, `.css`
- `client/src/components/TaskItem.jsx`, `.css`
- `docs/week04-react-frontend.md`
- `docs/week04-changes-from-week03.md`

## Files Modified

- `README.md` — now describes a two-process (server + client) workflow.
- Everything previously at project root was moved into `server/`
  (no code changes within those files).

## Dependencies Added

Client:
- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`

## Architecture Change

```
Week 3                              Week 4
-------                             -------
one Node app                     →  two processes:
                                      - server/  (unchanged backend)
                                      - client/  (new React app)
curl / Postman only              →  real UI in the browser
                                 →  Vite dev server at :5173
```

## New Concepts

- JSX
- Components, props, children
- `useState`
- Controlled forms
- List rendering and `key`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Vite dev server
- CSS custom properties, Flexbox, Grid, `clamp()`
- Media queries, `:focus-visible`

## Why We Made These Changes

A real MERN app has two independent processes: a Node/Express API and a
React frontend. Introducing them together is overwhelming, so Week 4
builds the UI with mock data and no network calls. This lets students
concentrate on React fundamentals — components, state, events — before
Week 5 wires them to the real API.

## Classroom Demonstration

1. Run `server/npm run dev` in one terminal and `client/npm run dev` in
   another. Point out that these are two different processes on
   different ports.
2. Open `http://localhost:5173`. Add a task. Watch the state update.
3. Edit a task; toggle it; switch filters.
4. **Refresh.** All UI state is gone — the backend was never involved.
5. In another terminal: `curl http://localhost:5000/api/tasks`.
   Compare: backend has data (MongoDB), UI has data (useState), **they
   do not talk to each other**. That's Week 5's job.
