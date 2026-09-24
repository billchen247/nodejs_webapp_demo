/* ---------------------------------------------------------------------------
 * src/controllers/home.js
 *
 * Serves the landing page at GET /.
 *
 * In the connect version we had to open the file with fs.promises, cache it
 * in a module-level variable, and pipe it out with a manual writeHead. Here
 * we just call `res.sendFile(path)` — Express handles the file read, the
 * Content-Type header, ETag caching, and streaming for us.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const path = require("path");

const HOME_PAGE = path.join(__dirname, "..", "views", "home.html");

function showHomePage(req, res, next) {
    // res.sendFile propagates any error (missing file, permissions issue)
    // through `next(err)` so our errorHandler middleware turns it into a
    // clean 500 response.
    res.sendFile(HOME_PAGE, (err) => {
        if (err) next(err);
    });
}

module.exports = { showHomePage };
