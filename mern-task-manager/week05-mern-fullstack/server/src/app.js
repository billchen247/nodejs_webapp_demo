/**
 * @file src/app.js
 * @author Bill Chen
 * @description Build and return the Express app for Week 5's server.
 *   Split out from server.js (just like Week 4) so tests can mount a
 *   fresh app without binding a port or opening a real database
 *   connection in beforeAll/afterAll hooks.
 *
 *   New this week: the React client now runs on its own origin
 *   (http://localhost:5173) and talks to this API over HTTP, so we
 *   need CORS enabled for that origin.
 */
import express from "express";
import cors from "cors";
import taskRoutes from "./routes/taskRoutes.js";

export function createApp() {
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

  const app = express();

  // CORS: let the React dev server call this API.
  // We whitelist a single origin — "*" would be too permissive in a real app.
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.log(`${req.method} ${req.url}`);
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 5 Task Manager API (Express + MongoDB + React)",
      client: CLIENT_URL,
      endpoints: [
        "GET    /api/tasks",
        "GET    /api/tasks/:id",
        "POST   /api/tasks",
        "PUT    /api/tasks/:id",
        "DELETE /api/tasks/:id",
      ],
    });
  });

  app.use("/api/tasks", taskRoutes);

  app.use((req, res) =>
    res.status(404).json({ error: "Not Found", method: req.method, url: req.url }),
  );

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
