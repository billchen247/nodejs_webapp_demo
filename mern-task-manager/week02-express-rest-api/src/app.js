/**
 * @file src/app.js
 * @author Bill Chen
 * @description Builds and returns the Express application.
 *
 * We separate "build the app" (this file) from "listen on a port"
 * (`server.js`). This split is a very common Node pattern:
 *   - `app.js` can be imported by unit tests and driven with `supertest`
 *     without ever touching the network.
 *   - `server.js` is the production entry point that actually binds a
 *     port and starts logging.
 */
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";

/**
 * Factory function that constructs a fresh Express app. We expose it as a
 * function (not just a singleton) so tests can build isolated instances
 * when they need to.
 */
export function createApp() {
  const app = express();

  // Middleware: parse JSON request bodies into `req.body`.
  // Without this, POST/PUT bodies would arrive as an empty object.
  app.use(express.json());

  // Simple request logger — runs on every request thanks to app.use(..).
  // We silence it under NODE_ENV=test so test output stays clean.
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  // Root welcome message describing the available endpoints.
  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 2 Task Manager (Express)",
      endpoints: [
        "GET    /api/tasks",
        "GET    /api/tasks/:id",
        "POST   /api/tasks",
        "PUT    /api/tasks/:id",
        "DELETE /api/tasks/:id",
      ],
    });
  });

  // Mount the task router under /api/tasks.
  app.use("/api/tasks", taskRoutes);

  // Fallback 404 handler — fires when no previous route matched.
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", method: req.method, url: req.url });
  });

  // Centralized error handler. The 4-argument signature (err, req, res, next)
  // is how Express identifies error-handling middleware.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
