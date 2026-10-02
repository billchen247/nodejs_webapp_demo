/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 9 server entry point.
 *   The Express app itself now lives in `./app.js` (mirroring Week 4)
 *   so tests can import `createApp()` without binding a port. This
 *   file's only job is to load env vars, connect to MongoDB, build the
 *   app, and start listening.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    await connectDatabase(MONGODB_URI);
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Week 9 server listening on http://localhost:${PORT}`);
      console.log(`CORS allowed origin: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
