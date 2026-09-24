/* ---------------------------------------------------------------------------
 * src/controllers/home.ts
 *
 * Serves the landing page at GET /.
 *
 * Same idea as ../../todo-node-api-express/src/controllers/home.ts, leaning
 * on Express's `res.sendFile()` for Content-Type, Content-Length, ETag, and
 * range requests.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import path from "node:path";

// Resolved once at module load. Uses process CWD so both `tsx` (dev) and
// `node dist/server.js` (prod) find the same file — the HTML is NOT copied
// into dist/ by tsc.
const HOME_PAGE = path.resolve(process.cwd(), "views", "home.html");

export const showHomePage: RequestHandler = (_req, res, next) => {
    res.sendFile(HOME_PAGE, (err) => {
        if (err) next(err);
    });
};
