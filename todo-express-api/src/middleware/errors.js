/* ---------------------------------------------------------------------------
 * src/middleware/errors.js
 *
 * Two terminal middlewares that live at the end of the Express chain:
 *
 *   * notFound       — nothing above us handled the request, so it must be
 *                      a URL we don't serve. Send a JSON 404.
 *
 *   * errorHandler   — any middleware above us that called `next(err)` (or
 *                      threw synchronously, or returned a rejected promise)
 *                      lands here. Express identifies an error handler by
 *                      its FOUR-argument signature: (err, req, res, next).
 *                      Don't be tempted to drop the unused `next` parameter
 *                      — Express uses `fn.length` to tell error handlers
 *                      apart from regular ones.
 *
 * We also translate the specific "invalid JSON body" error that
 * express.json() throws into a clean 400. Without this, malformed JSON
 * would bubble up as a 500.
 * -------------------------------------------------------------------------*/

function notFound(req, res) {
    res.status(404).json({ error: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // express.json() throws a SyntaxError with `type === "entity.parse.failed"`
    // for malformed request bodies. Map it to 400 so the API contract matches
    // ../todo-connect-api/src/middleware/body.js exactly.
    if (err && err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON body" });
    }

    console.error("Unhandled error while processing request:", err);
    if (res.headersSent) {
        // Headers already flushed; the best we can do is end the stream.
        return res.end();
    }
    res.status(500).json({ error: "Internal Server Error" });
}

module.exports = { notFound, errorHandler };
