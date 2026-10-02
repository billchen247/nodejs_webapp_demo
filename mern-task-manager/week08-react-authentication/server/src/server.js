/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 8 server entry point.
 *   Boots the database connection, builds the app from `./app.js`, and
 *   starts listening. Kept thin on purpose — anything testable lives in
 *   `createApp()` so tests never need to bind a real port.
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
      console.log(`Week 8 server listening on http://localhost:${PORT}`);
      console.log(`CORS allowed origin: ${CLIENT_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
