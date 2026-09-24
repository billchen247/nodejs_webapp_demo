/* ---------------------------------------------------------------------------
 * src/middleware/body.js
 *
 * JSON body parser, written as a Connect middleware. It reads the raw
 * request stream, JSON-parses it, and stores the result on `req.body` so
 * downstream controllers can just do `req.body.title`.
 *
 * This is the Connect equivalent of what Express calls `express.json()` and
 * what the popular `body-parser` package does — nothing more, nothing less.
 *
 * Why the request body is a stream
 * --------------------------------
 * HTTP bodies can be arbitrarily large. Node.js does not buffer them into
 * memory for you; instead it exposes `req` as a Node readable stream that
 * emits "data" events as chunks arrive:
 *
 *      request
 *         |
 *         +--> "data" chunk
 *         +--> "data" chunk
 *         +--> "data" chunk
 *         |
 *         +--> "end"
 *         |
 *         v
 *   Buffer.concat(...).toString("utf8")
 *         |
 *         v
 *      JSON.parse(...)
 *
 * We collect Buffer chunks first (rather than concatenating strings) because
 * a single UTF-8 character can be split across two chunks; only combining
 * the raw bytes and THEN decoding avoids the "half a character" problem.
 *
 * Design choices
 * --------------
 *   * We only try to parse the body for methods that typically carry one
 *     (POST, PUT, PATCH). GET/DELETE skip the parser and `req.body` stays
 *     `undefined`.
 *   * Invalid JSON becomes a 400 response IMMEDIATELY, so controllers can
 *     assume `req.body` is a parsed object.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const { sendError } = require("../utils/response");

// Methods that we bother reading a body for. Anything else is a no-op.
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

function body(req, res, next) {
    if (!METHODS_WITH_BODY.has(req.method)) {
        return next();
    }

    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));

    req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");

        // Empty body is legal — e.g. a PUT that just wants to toggle a
        // boolean might send nothing. Set an empty object rather than
        // crashing JSON.parse.
        if (raw === "") {
            req.body = {};
            return next();
        }

        try {
            req.body = JSON.parse(raw);
            next();
        } catch {
            // The client sent something that isn't valid JSON. Return a
            // clean 400 rather than letting a stack trace escape.
            sendError(res, 400, "Invalid JSON body");
        }
    });

    // Without an "error" listener, a broken connection would crash the
    // entire Node process. Route it into the Connect error chain instead.
    req.on("error", next);
}

module.exports = body;
