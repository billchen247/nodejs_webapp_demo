# Week 1 — Teaching Notes

## Learning goals

- Students can describe Node.js in one sentence.
- Students can start a Node.js project with `npm init`.
- Students can read a short HTTP server and explain each line.
- Students can hit endpoints with curl or the browser.
- Students know what HTTP methods and status codes are.

## Core concepts

### Node.js

Node.js is a runtime that executes JavaScript outside the browser.
It bundles Chrome's V8 engine with a standard library for files, networking,
processes, and more. We use it to build the **backend** of our application.

### `package.json`

Every Node.js project has a `package.json`. It records:

- the project name and version
- the scripts you can run (`npm run dev`, `npm start`)
- the module system (`"type": "module"` → ES Modules)
- the dependencies (none this week)

### ES Modules

We use `import` and `export`, not `require` and `module.exports`.
Setting `"type": "module"` in `package.json` enables this.

```js
import http from "node:http";
import { tasks } from "./data/tasks.js";
```

### The `http` module

`http.createServer((req, res) => { ... })` returns a server object.
We call `.listen(PORT, ...)` to start it. Inside the callback,
`req` describes the incoming request and `res` is how we respond.

### HTTP methods

| Method  | Purpose              |
| ------- | -------------------- |
| GET     | Read a resource      |
| POST    | Create a resource    |
| PUT     | Replace a resource   |
| PATCH   | Update a resource    |
| DELETE  | Delete a resource    |

Week 1 only uses GET. Week 2 will add the rest.

### Status codes

| Code | Meaning              |
| ---- | -------------------- |
| 200  | OK                   |
| 201  | Created              |
| 400  | Bad Request          |
| 401  | Unauthorized         |
| 403  | Forbidden            |
| 404  | Not Found            |
| 500  | Internal Server Err. |

### REST

REST uses HTTP methods + paths to describe actions on resources.
"Give me task 1" is `GET /api/tasks/1`.

### JSON

JSON is a text format. `res.writeHead(200, { "Content-Type": "application/json" })`
tells the client "I'm sending JSON." `JSON.stringify(obj)` turns a JavaScript
object into that text.

### In-memory data

The `tasks` array lives inside the Node.js process. When the process stops,
the data is gone. In Week 3 we will introduce MongoDB so data survives restarts.

## Why this is painful (and why Week 2 exists)

- We hand-parse the URL with a regex.
- Each endpoint repeats boilerplate (`writeHead`, `end`, `JSON.stringify`).
- Adding POST/PUT/DELETE would require parsing the request body ourselves.

Express solves all of this. That's next week.
