/* ---------------------------------------------------------------------------
 * src/controllers/home.ts
 *
 * Serves the landing page at GET /.
 *
 * Same idea as ../todo-connect-api/src/controllers/home.js, but leaning on
 * Express's `res.sendFile()` — which handles Content-Type, Content-Length,
 * ETag, and range requests for us. In the Connect version we did all of
 * that by hand.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import path from "node:path";

// Absolute path to the static HTML file. Resolved once at module load.
// We resolve relative to the process CWD (the project root) so both `tsx`
// (dev) and `node dist/server.js` (prod) find the same file — the HTML is
// NOT copied into dist/ by tsc.
const HOME_PAGE = path.resolve(process.cwd(), "views", "home.html");

export const showHomePage: RequestHandler = (_req, res, next) => {
    // res.sendFile streams the file, sets Content-Type from the extension,
    // and calls the callback with any I/O error so it flows into our
    // errorHandler middleware.
    res.sendFile(HOME_PAGE, (err) => {
        if (err) next(err);
    });
};
