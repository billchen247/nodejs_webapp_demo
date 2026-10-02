/**
 * @file src/app.js
 * @author Bill Chen
 * @description Build and return the Express app for Week 6's server.
 *   Split out from server.js so tests can mount a fresh app without
 *   binding a port or requiring a live Mongo connection — mirrors the
 *   Week 4 app.js/server.js split.
 */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";

export function createApp() {
  const app = express();
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

  // `credentials: true` is required because the client sends cookies with
  // its requests (via fetch(..., { credentials: "include" })).
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.log(`${req.method} ${req.url}`);
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 6 Task Manager API (with auth)",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", method: req.method, url: req.url });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
