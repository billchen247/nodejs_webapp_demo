/* ---------------------------------------------------------------------------
 * src/app.js
 *
 * Assembles the Express app: creates it, mounts each middleware in order,
 * attaches the routers, and wraps it in an http.Server. The server is NOT
 * started here — that's `server.js`'s job. Keeping app construction separate
 * from listening makes testing straightforward: tests can import `server`
 * and start it on port 0.
 *
 * What Express adds on top of Connect
 * -----------------------------------
 * Express is built on Connect. The middleware model is identical — every
 * handler is still `(req, res, next) => ...` — but Express bakes in three
 * things Connect deliberately leaves out:
 *
 *   1. A ROUTER. `express.Router()` handles method+URL matching and gives
 *      you path parameters like `/api/todos/:id`. In ../todo-connect-api
 *      we had to write that by hand in src/router.js.
 *   2. Response HELPERS. `res.json(x)` = writeHead + JSON.stringify + end,
 *      `res.status(n)` sets the status code fluently, `res.sendFile(p)`
 *      streams a file with the right Content-Type. In ../todo-connect-api
 *      we hand-rolled these in src/utils/response.js.
 *   3. A BODY PARSER. `express.json()` reads the request stream, parses
 *      JSON, and puts the result on `req.body`. In ../todo-connect-api
 *      that lived in src/middleware/body.js.
 *
 * Middleware chain in this app:
 *
 *     request
 *        |
 *        v
 *   [ cors() ]              set Access-Control-* headers (+ answer OPTIONS)
 *        |
 *        v
 *   [ /api-docs router ]    Swagger UI + spec
 *        |
 *        v
 *   [ express.json() ]      parse JSON request body into req.body
 *        |
 *        v
 *   [ / router ]            GET / -> home page
 *        |
 *        v
 *   [ /api/todos router ]   CRUD controllers
 *        |
 *        v
 *   [ notFound ]            no route matched -> 404 JSON
 *        |
 *        v
 *   [ errorHandler ]        any next(err) upstream lands here -> 500
 *
 * Compare this file with ../todo-connect-api/src/app.js. The pipeline is
 * the same, but the two custom middlewares (body, cors) and the entire
 * hand-written src/router.js are gone.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const http = require("http");
const express = require("express");
const cors = require("cors");

const homeController = require("./controllers/home");
const todosRouter = require("./routes/todos");
const swagger = require("./middleware/swagger");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

// The origin our future React dev server will run on. In a real project
// you would read this from process.env; we hard-code it so the CORS story
// stays concrete and matches ../todo-connect-api exactly.
const ALLOWED_ORIGIN = "http://localhost:5173";

// `cors` is the Express-team package that produces the same headers our
// hand-written middleware in ../todo-connect-api/src/middleware/cors.js
// produces — including a 204 short-circuit for OPTIONS preflights.
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        maxAge: 600,
    })
);

// Swagger UI is mounted BEFORE the JSON body parser: the docs page is all
// GETs, so there is nothing to parse, and skipping the parser keeps this
// branch cheap. Same ordering choice as ../todo-connect-api.
app.use("/api-docs", swagger);

// One line replaces the entire hand-rolled body parser from
// ../todo-connect-api/src/middleware/body.js. Invalid JSON becomes a 400
// via the error handler at the bottom of this file.
app.use(express.json());

// Home page. A GET-only route that streams the static HTML file.
app.get("/", homeController.showHomePage);

// Everything under /api/todos is handled by its own router module. The
// router uses `:id` path params, which is the piece Connect deliberately
// does not ship.
app.use("/api/todos", todosRouter);

// If we fall off the end of the chain, nothing matched: send a JSON 404.
app.use(notFound);

// Any middleware that called `next(err)` — or threw synchronously — ends
// up here. Express recognises error handlers by their arity (4 arguments).
app.use(errorHandler);

const server = http.createServer(app);

module.exports = { app, server, ALLOWED_ORIGIN };
