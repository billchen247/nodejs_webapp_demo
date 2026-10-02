# Week 5 — Full MERN Application

## What this week teaches

> **How do the frontend and backend work together?**

The two halves finally meet. React calls the Express API, Express talks
to MongoDB, and the UI reflects real persistent data.

## What changed from Week 4

### Server
- Added `cors` to allow requests from the Vite dev server origin.
- Added `CLIENT_URL` to `.env.example`.

### Client
- Added `client/.env.example` with `VITE_API_URL`.
- Added `client/src/services/taskService.js` — a thin `fetch` wrapper.
- Rewrote `Home.jsx` to:
  - fetch tasks on mount (`useEffect`)
  - call the API for every create / toggle / update / delete
  - render **loading** and **error** states
- All components now use MongoDB's `_id` instead of local `id`.
- Added CSS for loading and error states.

## Prerequisites

Same as Week 3: a running MongoDB.

## How to install

```bash
cd week05-mern-fullstack/server && npm install
cd ../client && npm install
```

## Configure `.env`

```bash
# server
cd server
cp .env.example .env

# client
cd ../client
cp .env.example .env
```

| File              | Variable         | Default                                   |
| ----------------- | ---------------- | ----------------------------------------- |
| `server/.env`     | `PORT`           | `5000`                                    |
| `server/.env`     | `MONGODB_URI`    | `mongodb://localhost:27017/taskmanager`   |
| `server/.env`     | `CLIENT_URL`     | `http://localhost:5173`                   |
| `client/.env`     | `VITE_API_URL`   | `http://localhost:5000`                   |

## How to run

Two terminals, as before:

```bash
cd week05-mern-fullstack/server && npm run dev
cd week05-mern-fullstack/client && npm run dev
```

Visit `http://localhost:5173`.

## API endpoints

Unchanged from Week 3:

| Method | Path              |
| ------ | ----------------- |
| GET    | `/api/tasks`      |
| GET    | `/api/tasks/:id`  |
| POST   | `/api/tasks`      |
| PUT    | `/api/tasks/:id`  |
| DELETE | `/api/tasks/:id`  |

## Important files

```
week05-mern-fullstack/
├── server/
│   ├── src/
│   │   ├── server.js                 # now uses CORS
│   │   ├── config/database.js
│   │   ├── models/Task.js
│   │   ├── routes/taskRoutes.js
│   │   ├── controllers/taskController.js
│   │   └── middleware/               # empty, prepared for Week 7
│   ├── package.json                  # + cors
│   └── .env.example                  # + CLIENT_URL
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/Home.jsx            # fetches from the API now
│   │   ├── components/TaskForm.jsx
│   │   ├── components/TaskList.jsx
│   │   ├── components/TaskItem.jsx
│   │   └── services/taskService.js   # new fetch wrapper
│   ├── package.json
│   └── .env.example                  # + VITE_API_URL
└── docs/
    ├── week05-mern-fullstack.md
    └── week05-changes-from-week04.md
```

## New dependencies

Server:
| Package | Why |
| ------- | --- |
| `cors`  | Allow cross-origin requests from the Vite dev server. |

## Architecture

```
         React (http://localhost:5173)
                 │
                 │ fetch(JSON)
                 ▼
         Express (http://localhost:5000)
                 │
                 ▼
         taskController
                 │
                 ▼
         Mongoose model (Task)
                 │
                 ▼
             MongoDB
```

## Suggested classroom demonstration

1. Start MongoDB. Start the server (`cd server && npm run dev`).
2. Start the client (`cd client && npm run dev`).
3. Open `http://localhost:5173`. If the list is empty, add a task.
4. Refresh the page. The task is still there — **persistence**.
5. In Compass, show that the task is a document in the `tasks` collection.
6. Delete the task from Compass; refresh the browser; it's gone.
7. Stop the server. Try to add a task; show the **error state** in the UI.
8. Start the server again; the UI recovers.

### Verifying full CRUD

1. Create a task in the UI → see it appear.
2. Refresh → still there.
3. Edit the title → the DB updates (check Compass).
4. Toggle complete → `completed` flips in Compass.
5. Delete → the document disappears from Compass.

## What students should understand after the lesson

- The browser's `fetch` makes HTTP requests, same as curl.
- A **service layer** (`taskService.js`) keeps network code out of components.
- Loading / error / empty states are first-class UI concerns.
- **CORS** is a browser rule: without the right header, `fetch` fails
  even though the server returned 200.
- Environment variables for the client must start with `VITE_` and are
  **public** — anyone can read them in the browser.
- The three pieces of MERN (MongoDB, Express, React) plus Node form a
  complete, realistic stack.
