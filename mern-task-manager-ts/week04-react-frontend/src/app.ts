/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 03
 * File: src/app.ts
 *
 * Same shape as Week 2. Important: this file does NOT open a MongoDB
 * connection. Database connections are opened by whoever starts the app
 * (`server.ts` for real runs, `tests/setup.ts` for the test suite).
 *
 * That split means Supertest can keep running the same `app` instance
 * across many tests without reconnecting.
 */
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import taskRoutes from "./routes/taskRoutes.js";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 3 Task Manager API",
      hint: "Data is now persisted in MongoDB. Try POST /api/tasks.",
    });
  });

  app.use("/api/tasks", taskRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
