/* =============================================================================
 * src/middleware/notFound.ts — 404 catch-all
 * =============================================================================
 *
 * Mounted *after* all real routes in `app.ts`. If the request made it this
 * far it didn't match anything, so we return a tidy 404 JSON instead of
 * Express's default HTML page.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import type { Request, Response } from "express";

export function notFound(req: Request, res: Response): void {
    res.status(404).json({
        error: "Not found.",
        method: req.method,
        path: req.originalUrl,
    });
}
