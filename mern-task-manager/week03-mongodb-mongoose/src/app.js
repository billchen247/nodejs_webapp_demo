/**
 * @file src/app.js
 * @author Bill Chen
 * @description Build and return the Express app for Week 3.
 *
 * The app is created separately from the database connection so unit tests
 * can mount their own in-memory MongoDB (via `mongodb-memory-server`) and
 * drive the HTTP surface with `supertest`.
 */
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";

export function createApp() {
  const app = express();

  // Parse JSON request bodies into `req.body`.
  app.use(express.json());

  // Minimal request logger. Suppressed in tests to keep output quiet.
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 3 Task Manager (Express + MongoDB)",
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

  app.use((req, res) => {
    res
      .status(404)
      .json({ error: "Not Found", method: req.method, url: req.url });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
