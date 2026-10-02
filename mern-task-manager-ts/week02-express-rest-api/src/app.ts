/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: src/app.ts
 *
 * The Express app factory.
 *
 * We separate "build the app" (this file) from "start the app"
 * (src/server.ts). That separation matters because tests want an app
 * instance they can hand to Supertest *without* opening a port.
 *
 * This pattern will stay the same for the rest of the course.
 */
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import taskRoutes from "./routes/taskRoutes.js";

export function createApp(): Express {
  const app = express();

  // Teach the app to parse incoming JSON bodies. Without this middleware
  // `req.body` would be `undefined`, which is a confusing first pitfall for
  // students coming from frameworks that handle this automatically.
  app.use(express.json());

  // A tiny welcome route so hitting the root in a browser is not a 404.
  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 2 Task Manager API",
      hint: "Try GET /api/tasks or POST a new task",
    });
  });

  // Mount the task router under the /api/tasks prefix. All of the controller's
  // paths are relative to that prefix.
  app.use("/api/tasks", taskRoutes);

  // 404 handler for anything we did not match above.
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  // Centralised error-handling middleware. Express knows this is an error
  // handler because it declares four parameters. Having one place where
  // unexpected errors become a 500 response makes debugging much easier.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console -- surface unexpected failures in dev
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
