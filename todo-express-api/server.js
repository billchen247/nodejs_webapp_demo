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
 *   1. src/app.js               -- creates the Express app + http.Server
 *   2. src/routes/todos.js      -- express.Router() for /api/todos
 *   3. src/controllers/         -- request handlers per resource
 *   4. src/models/              -- the JSON-file "database"
 *   5. src/middleware/errors.js -- notFound + error handler
 *   6. src/utils/               -- validation helper
 *   7. src/views/home.html      -- the landing page HTML
 *
 * Sister project: ../todo-connect-api implements the exact same API using
 * the Connect middleware framework, WITHOUT a built-in router. Compare the
 * two to see what Express adds on top of Connect.
 * ===========================================================================
 */

const { server } = require("./src/app");

// TCP port to listen on. process.env.PORT lets the test suite pick a free
// random port (PORT=0); otherwise we default to 3002 so this project can run
// side-by-side with ../todo-node-api (port 3000) and ../todo-connect-api
// (port 3001).
const PORT = Number(process.env.PORT) || 3002;

server.listen(PORT, () => {
    const actualPort = server.address().port;
    console.log(`Todo API (Express) listening on http://localhost:${actualPort}`);
    console.log(`Home page:   http://localhost:${actualPort}/`);
    console.log(`API root:    http://localhost:${actualPort}/api/todos`);
    console.log(`Swagger UI:  http://localhost:${actualPort}/api-docs/`);
});
