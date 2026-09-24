/* ---------------------------------------------------------------------------
 * src/middleware/cors.js
 *
 * A "middleware" is code that runs on every request BEFORE the route handler.
 * In Express you write `app.use(cors())`. Since we don't have Express, we
 * simply call setCorsHeaders(res) from inside our top-level request callback.
 *
 * CORS crash-course
 * -----------------
 * An "origin" is the tuple (scheme, host, port). For example
 *   http://localhost:5173  and  http://localhost:3000
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

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    // Let the browser cache the preflight for 10 minutes so it doesn't send
    // an OPTIONS request before every single call.
    res.setHeader("Access-Control-Max-Age", "600");
}

module.exports = { ALLOWED_ORIGIN, setCorsHeaders };
