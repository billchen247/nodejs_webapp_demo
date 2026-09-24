/* ---------------------------------------------------------------------------
 * src/middleware/cors.js
 *
 * CORS as a Connect middleware. Two responsibilities:
 *
 *   1. Attach Access-Control-* headers to every response.
 *   2. Short-circuit the OPTIONS preflight with a 204 response.
 *
 * Because this middleware is registered FIRST in src/app.js, every request
 * passes through here before it reaches the router or the body parser. That
 * matters for preflight: the browser sends OPTIONS with no body, and we don't
 * want the body parser or router to run for it.
 *
 * CORS crash-course
 * -----------------
 * An "origin" is the tuple (scheme, host, port). For example
 *   http://localhost:5173  and  http://localhost:3001
 * are DIFFERENT origins because the port differs. By default browsers block
 * JavaScript on origin A from reading responses served by origin B unless
 * origin B opts in with Access-Control-Allow-* headers.
 *
 * For "non-simple" requests (PUT/DELETE, custom headers, JSON bodies) the
 * browser first sends an OPTIONS "preflight" request. The server must reply
 * with the right CORS headers before the real request will be sent.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

// The origin our future React dev server will run on. In a real project you'd
// probably read this from process.env; we hard-code it so the CORS story
// stays concrete.
const ALLOWED_ORIGIN = "http://localhost:5173";

function cors(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    // Let the browser cache the preflight for 10 minutes so it doesn't send
    // an OPTIONS request before every single call.
    res.setHeader("Access-Control-Max-Age", "600");

    if (req.method === "OPTIONS") {
        // Answer the preflight and stop the chain here — no other middleware
        // needs to run.
        res.writeHead(204);
        return res.end();
    }

    next();
}

module.exports = cors;
module.exports.ALLOWED_ORIGIN = ALLOWED_ORIGIN;
