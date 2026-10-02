# Week 5 — Full MERN Integration

> **Question of the week:** *How do we make the UI and the API talk to each other?*

Week 4 built a React UI with mock data. Week 3 built an Express + Mongoose
backend. This week we join them. The React app now performs **real CRUD
operations against MongoDB** by calling the Express API.

Along the way we meet two concepts that only exist because the two halves
of a MERN app live on different origins:

- **CORS** — teaching the API to say "yes, this React app may call me".
- **A service layer in React** — so components never see `fetch` directly.

---

## What this week teaches

- Why the browser enforces the same-origin policy and how CORS opts in.
- Picking a sane allow-list (one origin, not `*`), and why that matters
  the moment Week 6 adds authentication cookies.
- Running two dev servers concurrently (`dev:server` and `dev:client`).
- Environment variables for both halves: `CLIENT_URL` on the server,
  `VITE_API_URL` on the client.
- Writing a `services/api.ts` wrapper around `fetch` so the UI never
  touches HTTP primitives.
- Handling the three states a networked UI always has: **loading**,
  **error**, **ready**.
- Testing a React component that calls a service: mock the service, not
  the global `fetch`.
- Testing the service itself: stub `fetch` and assert on the exact
  request shape.

---

## Project layout

Week 5 **restructures** the project. The backend moves into `server/` to
make space for a top-level root that owns both halves.

```
week05-mern-fullstack/
├── package.json              # root — proxy scripts for both halves
├── .env.example              # merged example for reference
├── .gitignore
├── README.md
├── docs/
│   ├── week05-mern-fullstack.md
│   └── week05-changes-from-week04.md
│
├── server/                   # Express + Mongoose API (from Week 3, + CORS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts            # CORS wired in here
│   │   ├── server.ts
│   │   ├── config/database.ts
│   │   ├── controllers/taskController.ts
│   │   ├── models/Task.ts
│   │   └── routes/taskRoutes.ts
│   └── tests/
│       ├── setup.ts
│       ├── taskApi.test.ts   # + CORS tests
│       └── taskModel.test.ts
│
└── client/                   # React UI (from Week 4, now wired to API)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx / App.css
        ├── index.css
        ├── types.ts
        ├── services/api.ts   # NEW — fetch wrapper
        ├── pages/
        │   └── Home.tsx / Home.css   # NEW — loading/error states
        └── components/
            ├── TaskForm.tsx / TaskForm.css
            ├── TaskItem.tsx / TaskItem.css
            └── TaskList.tsx / TaskList.css
    └── tests/
        ├── setup.ts
        ├── api.test.ts        # NEW — service layer tests
        ├── TaskForm.test.tsx
        ├── TaskList.test.tsx
        └── Home.test.tsx      # rewritten — mocks the API
```

---

## Installation

```bash
cd week05-mern-fullstack
npm run install:all        # installs for both server/ and client/
```

Delete any `package-lock.json` files that `npm install` creates — they are
intentionally ignored by git in this teaching repo.

Copy the env examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

---

## Running the two servers

In **two separate terminal tabs**:

```bash
# Terminal 1 — API on http://localhost:3000
npm run dev:server
```

```bash
# Terminal 2 — React dev server on http://localhost:5173
npm run dev:client
```

Open http://localhost:5173 and try it. Every add / toggle / delete now
round-trips through Express and MongoDB. Refresh the page — the tasks
survive, because they live in the database.

If you prefer one terminal, you can run them in parallel with
`npm-run-all` or `concurrently` (not installed here on purpose, to keep
dependency count small).

---

## Running tests

```bash
npm run test           # server tests, then client tests
npm run test:server
npm run test:client
npm run test:coverage  # both suites with coverage
```

- **Server tests** (`server/tests/*`) run in a jsdom-free Node environment
  with an in-memory MongoDB. Includes new CORS header assertions.
- **Client tests** (`client/tests/*`) run in jsdom with React Testing
  Library. `Home.test.tsx` mocks the `api` module; `api.test.ts` stubs
  the global `fetch` to pin the exact request shape.

---

## New dependencies this week

Server:

- `cors` — Express middleware for Cross-Origin Resource Sharing.
- `@types/cors` — TypeScript types.

Client: *(no new runtime deps)*

---

## Architecture

```
Browser (http://localhost:5173)
   │
   │ fetch("http://localhost:3000/api/tasks", { ... })
   ▼
Vite dev server (serves React bundle, port 5173)
   │
   ▼
React App
   ├─ pages/Home.tsx            (loading / error / ready)
   │     ├─ TaskForm            (optimistic? no — see docs)
   │     └─ TaskList
   │           └─ TaskItem[]
   └─ services/api.ts           (fetch wrapper + ApiError)
          │
          ▼
   HTTP (CORS-allowed)
          │
          ▼
Express API (port 3000)
   ├─ cors({ origin: CLIENT_URL })
   ├─ /api/tasks routes
   └─ Mongoose
          │
          ▼
      MongoDB
```

---

## Suggested classroom demonstration

1. Start both dev servers and show the Network panel: every click fires
   an HTTP request.
2. Stop the API server and click "Retry" — show how the error banner
   drives the user through a transient failure.
3. Open the DevTools console and run `fetch("http://localhost:3000/api/tasks")`
   from, e.g., `https://example.com` to show the browser blocking it.
   Compare with the same call from the React app (allowed by CORS).
4. Walk through `services/api.ts`. Why is it worth a whole file?
5. Point out that `Home.tsx` has three visual states — loading, error,
   ready — and that forgetting any one of them is the #1 cause of bad
   feeling UIs.

---

## What students should understand after this lesson

- A full-stack SPA talks to its backend over HTTP, like any other client.
- CORS exists to protect users; servers opt in to specific origins.
- A thin service layer makes network calls testable *and* swappable.
- Every network call has three states; the UI must handle all three.
- Mocking a service is cleaner than mocking `fetch` for UI tests, but
  pinning the exact request shape is still worth a dedicated test file.
