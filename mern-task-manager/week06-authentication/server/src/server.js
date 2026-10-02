/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 6 server entry point.
 *   Connects to MongoDB, then builds the Express app (see app.js) and
 *   starts listening. Kept intentionally thin so tests can import
 *   `createApp()` directly without needing a live DB connection or a
 *   bound port — mirrors the Week 4 server.js split.
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
      console.log(`Week 6 server listening on http://localhost:${PORT}`);
      console.log(`CORS allowed origin: ${CLIENT_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
