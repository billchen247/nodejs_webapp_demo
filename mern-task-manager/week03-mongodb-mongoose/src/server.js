/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 3 entry point — Express + MongoDB (via Mongoose).
 *
 * We now connect to a real database before starting the HTTP server. If
 * MongoDB cannot be reached we exit non-zero so a process supervisor
 * (pm2, docker, kubernetes) can restart or alert on us.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    // Connect to the database first, THEN start listening. If we accepted
    // requests before the DB was ready, they'd all fail with 500.
    await connectDatabase(MONGODB_URI);
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Week 3 server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
