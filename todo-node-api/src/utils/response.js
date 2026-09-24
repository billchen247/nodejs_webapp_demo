/* ---------------------------------------------------------------------------
 * src/utils/response.js
 *
 * Small helpers that write a full HTTP response in one call. Extracted here so
 * every controller can use them without repeating the same three lines
 * (writeHead + stringify + end).
 *
 * In Express these helpers are the equivalent of:
 *     res.status(200).json({ ... })     -> sendJson
 *     res.status(500).json({ error })   -> sendError
 *     res.status(200).type("html").send -> sendHtml
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

// Send a JSON response with the given status code and body.
//
// res.writeHead(statusCode, headers) writes the HTTP status line and the
// response headers. It MUST run before res.end() (or the first res.write()),
// because after the body starts flowing the headers are already gone.
function sendJson(res, statusCode, body) {
    const payload = JSON.stringify(body);
    res.writeHead(statusCode, {
        // Content-Type tells the client how to interpret the response body.
        // "application/json" is the standard MIME type for JSON.
        "Content-Type": "application/json; charset=utf-8",
    });
    res.end(payload);
}

// Every error response follows the same shape { error: "message" } so
// clients (including our tests and any future React app) can handle
// failures uniformly.
function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { error: message });
}

// Send an HTML response. Used by the home page controller.
function sendHtml(res, statusCode, html) {
    res.writeHead(statusCode, {
        "Content-Type": "text/html; charset=utf-8",
    });
    res.end(html);
}

module.exports = { sendJson, sendError, sendHtml };
