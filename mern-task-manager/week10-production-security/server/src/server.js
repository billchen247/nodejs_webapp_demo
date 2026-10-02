/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 10 server entry point.
 *   Thin on purpose: validate the environment, connect to MongoDB, build
 *   the Express app via `createApp()` (see src/app.js for the hardened
 *   middleware stack — helmet, CORS, rate limiting, routes, error
 *   handling), then start listening. Tests import `createApp()` directly
 *   and skip this file entirely, so it never runs under NODE_ENV=test.
 */

import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env, assertSafeEnvOrExit } from "./config/env.js";

assertSafeEnvOrExit();

async function start() {
  try {
    await connectDatabase(env.MONGODB_URI);
    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(
        `Week 10 server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`
      );
      console.log(`CORS allowed origins: ${env.CLIENT_URLS.join(", ")}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
