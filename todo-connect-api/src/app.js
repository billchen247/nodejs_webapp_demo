/* ---------------------------------------------------------------------------
 * src/app.js
 *
 * Assembles the Connect app: creates it, `.use()`s each middleware in order,
 * and wraps it in an http.Server. The server is NOT started here — that's
 * `server.js`'s job. Keeping app construction separate from listening makes
 * testing straightforward: tests can import `server` and start it on port 0.
 *
 * What is Connect?
 * ----------------
 * Connect is a tiny middleware framework — Express is built on top of it. A
 * "middleware" is just a function with the signature:
 *
 *     function (req, res, next) { ... }
 *
 * Connect calls them in the order they were registered. Each middleware may:
 *   - respond to the request (res.end / res.writeHead) and stop the chain, OR
 *   - call `next()` to hand off to the middleware after it, OR
 *   - call `next(err)` to skip ahead to the first ERROR middleware
 *     (signature: (err, req, res, next)).
 *
 * Middleware chain in this app:
 *
 *     request
 *        |
 *        v
 *   [ cors ]              set Access-Control-* headers (+ answer OPTIONS 204)
 *        |
 *        v
 *   [ swagger ]           mounted at /api-docs -- serves Swagger UI + spec
 *        |
 *        v
 *   [ body ]              parse JSON request body into req.body
 *        |
 *        v
 *   [ router ]            match method+URL, call the right controller
 *        |
 *        v
 *   [ notFound ]          no middleware handled it -> 404
 *        |
 *        v
 *   [ errorHandler ]      any next(err) upstream lands here -> 500 (or 400)
 *
 * Compare this to ../todo-node-api/src/app.js, which does all of this inside
 * a single hand-written `http.createServer` callback. Connect turns that
 * monolithic callback into a composable pipeline of small functions.
 * -------------------------------------------------------------------------*/

const http = require("http");
const connect = require("connect");

const cors = require("./middleware/cors");
const body = require("./middleware/body");
const swagger = require("./middleware/swagger");
const { router } = require("./router");
const { notFound, errorHandler } = require("./middleware/errors");

// connect() returns a function that itself has `.use()` on it. Node's
// http.createServer accepts any (req, res) => ... function, so we can pass
// the app straight to it.
const app = connect();

// Order matters. CORS runs first so preflight OPTIONS requests get answered
// before anything else touches them. The body parser runs before the router
// so controllers can rely on `req.body` being populated.
app.use(cors);

// Swagger UI is mounted at /api-docs. Mounting BEFORE the body parser is
// deliberate: the docs page is all GETs, so there is nothing to parse, and
// skipping the parser keeps this branch cheap.
app.use("/api-docs", swagger);

app.use(body);
app.use(router);

// If we fall off the end of the chain, nothing matched: send a JSON 404.
app.use(notFound);

// Any middleware that called `next(err)` — or threw synchronously — ends
// up here. Connect recognises error handlers by their arity (4 arguments).
app.use(errorHandler);

const server = http.createServer(app);

module.exports = { app, server };
