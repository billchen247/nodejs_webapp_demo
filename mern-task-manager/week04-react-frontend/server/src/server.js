/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 4 server entry point.
 *   The server itself is a verbatim copy of Week 3's Express + MongoDB
 *   API. The excitement this week is on the client — a fresh React UI
 *   under `../client/` consumes this API through Vite's dev proxy.
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
      console.log(`Week 4 server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
