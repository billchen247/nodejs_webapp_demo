/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: server/src/server.ts
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 3000);
  const mongoUri = process.env.MONGODB_URI ?? "";
  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

  // Fail fast if the secret is missing. Better than a confusing 500 later.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set it in your .env to a random string of 32+ characters.",
    );
  }

  await connectToDatabase(mongoUri);
  // eslint-disable-next-line no-console
  console.log(`Connected to MongoDB at ${mongoUri}`);

  const app = createApp({ clientUrl });
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Week 7 API server listening on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`Accepting credentialed CORS requests from ${clientUrl}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});
