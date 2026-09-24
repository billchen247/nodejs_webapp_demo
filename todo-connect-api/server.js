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
 *   1. src/app.js          -- creates the Connect app + http.Server
 *   2. src/router.js       -- middleware that matches method+pathname
 *   3. src/controllers/    -- request handlers per resource
 *   4. src/models/         -- the JSON-file "database"
 *   5. src/middleware/     -- CORS + request-body parsing + errors
 *   6. src/utils/          -- shared response + validation helpers
 *   7. src/views/home.html -- the landing page HTML
 *
 * Sister project: ../todo-node-api implements the exact same API using ONLY
 * Node's built-in `http` module — no framework at all. Compare the two to
 * see what Connect is doing for you.
 * ===========================================================================
 * @author Bill Chen
 */

const { server } = require("./src/app");

// TCP port to listen on. process.env.PORT lets the test suite pick a free
// random port (PORT=0); otherwise we default to 3001 so this project can run
// side-by-side with the sister ../todo-node-api project on port 3000.
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
    const actualPort = server.address().port;
    console.log(`Todo API (Connect) listening on http://localhost:${actualPort}`);
    console.log(`Home page:   http://localhost:${actualPort}/`);
    console.log(`API root:    http://localhost:${actualPort}/api/todos`);
    console.log(`Swagger UI:  http://localhost:${actualPort}/api-docs/`);
});
