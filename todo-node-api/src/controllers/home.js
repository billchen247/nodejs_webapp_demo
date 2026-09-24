/* ---------------------------------------------------------------------------
 * src/controllers/home.js
 *
 * Serves the landing page at GET /.
 *
 * Educational note: an HTTP server can send back any content type, not just
 * JSON. Here we read a static .html file from disk and stream it back with
 * a Content-Type of "text/html". This is the same thing Express's
 * `res.sendFile()` does under the hood.
 * -------------------------------------------------------------------------*/

const fs = require("fs/promises");
const path = require("path");
const { sendHtml, sendError } = require("../utils/response");

// Absolute path to the HTML file. Resolved once at module load so we don't
// recompute it on every request.
const HOME_PAGE = path.join(__dirname, "..", "views", "home.html");

// Cache the file contents in memory after the first read. Reading a small
// HTML file from disk on every request would be wasteful, and this file
// never changes at runtime.
let cached = null;

async function showHomePage(res) {
    try {
        if (cached === null) {
            cached = await fs.readFile(HOME_PAGE, "utf8");
        }
        sendHtml(res, 200, cached);
    } catch (err) {
        // Something is very wrong (missing view file, permissions issue).
        // Log for the operator, send a generic 500 to the client.
        console.error("Failed to read home page:", err);
        sendError(res, 500, "Internal Server Error");
    }
}

module.exports = { showHomePage };
