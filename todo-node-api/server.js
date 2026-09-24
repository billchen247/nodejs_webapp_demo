/* =============================================================================
 * server.js — entry point
 * =============================================================================
 *
 * The whole HTTP server is constructed in `src/app.js`. This file exists only
 * to start it listening. Keeping the entry point tiny is a common convention
 * in Node.js REST APIs: it makes testing simpler (tests import from src/app
 * and pick their own port), and it separates "how the server is wired up"
 * from "how the process is run".
 *
 * Read next:
 *   1. src/app.js          -- creates http.Server and wires up middleware
 *   2. src/router.js       -- matches method + pathname to a controller
 *   3. src/controllers/    -- request handlers per resource
 *   4. src/models/         -- the JSON-file "database"
 *   5. src/middleware/     -- CORS + request-body parsing
 *   6. src/utils/          -- shared response + validation helpers
 *   7. src/views/home.html -- the landing page HTML
 * ===========================================================================
 * @author Bill Chen
 */

const { server } = require("./src/app");

// TCP port to listen on. process.env.PORT lets the test suite pick a free
// random port (PORT=0); otherwise we default to 3000, the conventional
// port for local Node.js APIs.
const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
    const actualPort = server.address().port;
    console.log(`Todo API listening on http://localhost:${actualPort}`);
    console.log(`Home page:  http://localhost:${actualPort}/`);
    console.log(`API root:   http://localhost:${actualPort}/api/todos`);
});
