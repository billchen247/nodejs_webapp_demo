/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 03
 * File: src/server.ts
 *
 * Startup sequence:
 *   1. Load environment variables from .env (if present).
 *   2. Open a MongoDB connection.
 *   3. Build the Express app.
 *   4. Start listening.
 *
 * We await the database connection before binding the port so the first
 * request will not have to wait for Mongoose to buffer-flush.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 3000);
  const mongoUri = process.env.MONGODB_URI ?? "";

  await connectToDatabase(mongoUri);
  // eslint-disable-next-line no-console
  console.log(`Connected to MongoDB at ${mongoUri}`);

  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Week 3 server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});
