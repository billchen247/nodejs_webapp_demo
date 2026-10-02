/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/src/app.ts
 *
 * New in Week 6:
 *   - `cookie-parser` middleware (so `req.cookies` is a usable object).
 *   - `/api/auth` routes mounted.
 *   - CORS now runs with `credentials: true` so the browser is allowed to
 *     attach the auth cookie on cross-origin requests.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

export interface CreateAppOptions {
  clientUrl?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  const clientUrl = options.clientUrl ?? "http://localhost:5173";

  // credentials: true is what tells the browser "it is OK to attach cookies
  // and read Set-Cookie" on cross-origin requests. Without it, the auth
  // cookie would never make the trip from http://localhost:5173.
  app.use(cors({ origin: [clientUrl], credentials: true }));

  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 7 Task Manager API",
      hint: "/api/tasks is now protected. Log in first and the browser will attach the cookie.",
    });
  });

  app.use("/api/auth", authRoutes);
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
