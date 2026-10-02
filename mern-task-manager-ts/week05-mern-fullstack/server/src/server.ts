/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/src/server.ts
 *
 * Startup sequence:
 *   1. Load environment variables from .env (if present).
 *   2. Open a MongoDB connection.
 *   3. Build the Express app, passing in the allowed client origin.
 *   4. Start listening.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 3000);
  const mongoUri = process.env.MONGODB_URI ?? "";
  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

  await connectToDatabase(mongoUri);
  // eslint-disable-next-line no-console
  console.log(`Connected to MongoDB at ${mongoUri}`);

  const app = createApp({ clientUrl });
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Week 5 API server listening on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`Accepting CORS requests from ${clientUrl}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});
