/* ---------------------------------------------------------------------------
 * src/app.js
 *
 * Assembles the HTTP server: creates it, wires up middleware, and hands
 * every request off to the router. The server is NOT started here — that's
 * `server.js`'s job. Keeping app construction separate from listening makes
 * testing straightforward: tests can import `server` and start it on port 0.
 *
 * Request lifecycle at this level:
 *
 *   http.createServer callback fires
 *          |
 *          v
 *   setCorsHeaders(res)   (CORS middleware runs on every response)
 *          |
 *          v
 *   was this an OPTIONS preflight?  --yes--> reply 204, done
 *          |
 *          v
 *   route(req, res)       (delegates to a controller)
 *          |
 *          v
 *   any uncaught error?  --yes--> log + send 500
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const http = require("http");
const { setCorsHeaders } = require("./middleware/cors");
const { route } = require("./router");
const { sendError } = require("./utils/response");

const server = http.createServer(async (req, res) => {
    // Attach CORS headers to EVERY response. The browser looks for these on
    // the response to decide whether the page's JavaScript may read the body.
    setCorsHeaders(res);

    // Answer the CORS preflight before it reaches the router. The browser
    // sends this OPTIONS request automatically before any non-simple call;
    // 204 No Content with the right headers is enough.
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // A single top-level try/catch protects the process from any unhandled
    // exception inside a controller. Without this, one bug could crash the
    // whole server and stop accepting connections.
    try {
        await route(req, res);
    } catch (err) {
        console.error("Unhandled error while processing request:", err);
        if (!res.headersSent) {
            sendError(res, 500, "Internal Server Error");
        } else {
            // Headers already flushed; the best we can do is end the stream.
            res.end();
        }
    }
});

module.exports = { server };
