/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 5 server entry point.
 *   The Express app itself now lives in `app.js` (same split as Week 4)
 *   so tests can import `createApp()` directly. This file is only
 *   responsible for wiring the real database connection and listening
 *   on a port — the "boring but important" bootstrapping work.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function start() {
  try {
    await connectDatabase(MONGODB_URI);
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Week 5 server listening on http://localhost:${PORT}`);
      console.log(`CORS allowed origin: ${CLIENT_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
