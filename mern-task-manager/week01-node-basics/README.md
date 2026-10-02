# Week 1 — Node.js Basics

## What this week teaches

> **What is Node.js?**

By the end of this week, students should be able to answer:

- What is Node.js, and how is it different from JavaScript in the browser?
- What is `npm` and what does `package.json` do?
- How do we start an HTTP server using only Node's built-in modules?
- What does an HTTP request/response look like?
- What is a REST endpoint, and what are status codes?

## What is new this week

This is the first week — the project starts here.

- A plain Node.js project (ES Modules).
- A tiny HTTP server built with the built-in `http` module.
- An in-memory array of tasks (no database).
- Three read-only REST endpoints.

## How to install

There are **no dependencies** in Week 1 — that is intentional.

```bash
cd week01-node-basics
npm install   # creates no node_modules, but confirms package.json
```

## Configure `.env`

Copy the example file and adjust if you want a different port:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT`   | `5000`  | Port the HTTP server listens on. |

> Node 20+ supports `--env-file=.env`. If you want to try it:
> `node --env-file=.env src/server.js`

## How to run

```bash
npm run dev     # restarts on file changes (Node 20+ --watch)
# or
npm start       # plain node
```

You should see:

```
Week 1 server listening on http://localhost:5000
```

## API endpoints

| Method | Path              | Description                     |
| ------ | ----------------- | ------------------------------- |
| GET    | `/`               | Welcome message + endpoint list |
| GET    | `/api/tasks`      | List all in-memory tasks        |
| GET    | `/api/tasks/:id`  | Fetch a single task by id       |

Try them with curl:

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/tasks
curl http://localhost:5000/api/tasks/1
curl -i http://localhost:5000/api/tasks/999   # 404
```

## Important files

```
week01-node-basics/
├── package.json         # project metadata + scripts, no dependencies
├── .gitignore           # ignores node_modules, .env, package-lock.json
├── .env.example         # example environment variables
├── README.md            # this file
├── docs/
│   └── week01-node-basics.md
└── src/
    ├── server.js        # the HTTP server
    └── data/
        └── tasks.js     # in-memory tasks array
```

## New dependencies

None. Node.js and `http` are built in.

## Architecture

```
Browser / curl
     |
     v
Node http server (src/server.js)
     |
     v
Hand-written router (if/else on method + url)
     |
     v
In-memory array (src/data/tasks.js)
```

## Suggested classroom demonstration

1. Open `src/server.js` and read it line by line.
2. Run `npm run dev`.
3. In the browser, visit `http://localhost:5000/api/tasks`.
4. Open the Network tab — point out the status code and `Content-Type`.
5. Visit `http://localhost:5000/api/tasks/999` — show the 404 response.
6. Edit `tasks.js`, save, show how `--watch` restarts the server.
7. Discuss: what would be painful if we added POST/PUT/DELETE here? (This motivates Week 2 — Express.)

## What students should understand after the lesson

- Node.js runs JavaScript outside the browser.
- `npm` manages projects via `package.json`.
- ES Modules use `import` / `export`.
- An HTTP server listens on a port and reacts to `req` / `res`.
- REST endpoints combine a method (GET) and a path (`/api/tasks/1`).
- Status codes communicate meaning: 200 OK, 404 Not Found.
- JSON is just text — the client has to decide what to do with it.
