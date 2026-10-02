/**
 * @file src/app.js
 * @author Bill Chen
 * @description Build and return the Express app for Week 4's server.
 *   Same API as Week 3; split out from server.js so tests can mount a
 *   fresh app without binding a port.
 */
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.log(`${req.method} ${req.url}`);
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 4 Task Manager (Express + MongoDB)",
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
