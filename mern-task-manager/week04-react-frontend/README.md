# Week 4 — React Frontend

## What this week teaches

> **How do we build the UI?**

So far everything has been backend. This week we introduce **React**
as a standalone frontend. The backend from Week 3 still exists in
`server/`, but the React app does **not call it yet** — it uses local
mock data. We will connect the two in Week 5.

Why wait? Because learning React *and* API integration *and* CORS *and*
loading/error states at the same time is a lot. One new idea at a time.

## What changed from Week 3

- The backend moved into `server/` (unchanged contents).
- Added a new `client/` directory — a React app scaffolded for Vite.
- Introduced components, state, props, events, and modern plain CSS.
- Added a top-level `.gitignore` covering both `server/` and `client/`.

## How to install

Install dependencies for both projects (two separate `npm install`s):

```bash
cd week04-react-frontend/server
npm install

cd ../client
npm install
```

## Configure `.env`

Only the server needs `.env` this week:

```bash
cd server
cp .env.example .env
```

See `server/.env.example` for `PORT` and `MONGODB_URI`.

## How to run

```bash
# Terminal A — backend (unchanged from Week 3)
cd week04-react-frontend/server
npm run dev
# → http://localhost:5000

# Terminal B — frontend (new)
cd week04-react-frontend/client
npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173`. The React app will show three mock tasks
and let you add, edit, complete, delete, and filter them — all in
browser memory. Refresh the page and all your changes are gone, because
nothing is persisted yet.

## API endpoints

The server still exposes:

| Method | Path              |
| ------ | ----------------- |
| GET    | `/api/tasks`      |
| GET    | `/api/tasks/:id`  |
| POST   | `/api/tasks`      |
| PUT    | `/api/tasks/:id`  |
| DELETE | `/api/tasks/:id`  |

But the React UI does not call them yet — see Week 5.

## Important files

```
week04-react-frontend/
├── .gitignore                        # shared across server + client
├── README.md
├── docs/
│   ├── week04-react-frontend.md
│   └── week04-changes-from-week03.md
├── server/                           # unchanged backend from Week 3
│   ├── package.json
│   ├── .env.example
│   └── src/...
└── client/                           # new React app
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx                  # React entry point
        ├── App.jsx                   # app shell
        ├── App.css
        ├── index.css                 # global styles (CSS variables)
        ├── pages/
        │   ├── Home.jsx              # the main page (state lives here)
        │   └── Home.css
        └── components/
            ├── TaskForm.jsx          # controlled form
            ├── TaskForm.css
            ├── TaskList.jsx          # list / empty state
            ├── TaskList.css
            ├── TaskItem.jsx          # one task card (view / edit)
            └── TaskItem.css
```

## New dependencies

Client:
| Package | Why |
| ------- | --- |
| `react`, `react-dom` | React itself. |
| `vite`, `@vitejs/plugin-react` | Dev server + bundler. |

## Architecture

```
┌───────────────────────────────┐
│ Browser (http://localhost:5173)│
│                                │
│  App.jsx                       │
│    └── Home.jsx (state here)   │
│         ├── TaskForm.jsx       │
│         └── TaskList.jsx       │
│              └── TaskItem.jsx  │
│                                │
│  Mock data in useState         │
└───────────────────────────────┘

(Backend exists but is not called this week.)
```

## Suggested classroom demonstration

1. Run both servers. Open `http://localhost:5173`.
2. Add a task — point out the state update + re-render.
3. Edit it, toggle it, filter by Active/Completed.
4. **Refresh the browser.** All data is gone. Why? Because the browser's
   JavaScript memory was wiped — the backend isn't involved.
5. Open DevTools → React Components (if the extension is installed) and
   inspect props/state.
6. Compare with the Week 3 `curl` demo: data in MongoDB survives restart
   but the UI resets. In Week 5 we'll connect them.

## What students should understand after the lesson

- **Components** are functions that return JSX.
- **Props** flow in from the parent.
- **State** (`useState`) belongs to a component; changing it triggers a re-render.
- **Events** (`onClick`, `onChange`, `onSubmit`) are camelCase in JSX.
- **Lists** need stable `key` props.
- **Controlled inputs**: React owns the value, `onChange` updates state.
- **CSS variables** make the whole app easy to re-theme.
- **Flexbox + Grid** handle layout, with `clamp()` and media queries for responsiveness.
- The browser's memory is **ephemeral** — real apps need a backend.
