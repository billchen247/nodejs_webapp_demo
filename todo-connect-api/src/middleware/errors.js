/* ---------------------------------------------------------------------------
 * src/middleware/errors.js
 *
 * Two terminal middlewares that live at the end of the Connect chain:
 *
 *   * notFound       — nothing above us handled the request, so it must be
 *                      a URL we don't serve. Send a JSON 404.
 *
 *   * errorHandler   — any middleware above us that called `next(err)` (or
 *                      threw synchronously) lands here. Connect identifies
 *                      an error handler by its FOUR-argument signature:
 *                      (err, req, res, next). Don't be tempted to drop the
 *                      unused `next` parameter — Connect uses `fn.length`
 *                      to tell error handlers apart from regular ones.
 *
 * Contrast with ../todo-node-api: there, the top-level try/catch and the
 * "no route matched" fallback both live inside a single monolithic request
 * callback. Connect lets us pull each concern out into its own file.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const { sendError } = require("../utils/response");

function notFound(req, res, next) {
    sendError(res, 404, "Route not found");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    console.error("Unhandled error while processing request:", err);
    if (res.headersSent) {
        // Headers already flushed; the best we can do is end the stream.
        return res.end();
    }
    sendError(res, 500, "Internal Server Error");
}

module.exports = { notFound, errorHandler };
