/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/app.ts
 *
 * New in Week 9:
 *   - `/api/users` admin router is mounted. Every route on it is
 *     protected by `requireAuth + requireRole("admin")`.
 *
 * Carried over from earlier weeks:
 *   - `cookie-parser` middleware (so `req.cookies` is a usable object).
 *   - `/api/auth` routes.
 *   - `/api/tasks` routes behind `requireAuth`.
 *   - CORS with `credentials: true` so the browser attaches the auth
 *     cookie on cross-origin requests.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

export interface CreateAppOptions {
  clientUrl?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  const clientUrl = options.clientUrl ?? "http://localhost:5173";

  app.use(cors({ origin: [clientUrl], credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 9 Task Manager API",
      hint: "Admin-only routes live at /api/users. Log in as an admin first.",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);

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
