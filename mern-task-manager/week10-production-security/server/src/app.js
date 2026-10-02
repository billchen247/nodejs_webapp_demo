/**
 * @file src/app.js
 * @author Bill Chen
 * @description Build and return the Express app for Week 10's hardened
 *   server. Split out from server.js (same reason as Week 4: tests can
 *   mount a fresh app via `createApp()` without binding a port or
 *   re-running the startup env assertion).
 *
 * Order matters here. Middleware is applied top-to-bottom:
 *   1. trust proxy           — accept X-Forwarded-* only from proxies we trust
 *   2. helmet                — set defensive HTTP response headers
 *   3. CORS (allowlist)      — only our configured origins may call us
 *   4. body + cookie parsers — with a size limit so a huge body can't OOM us
 *   5. apiLimiter            — generic cap on all /api traffic
 *   6. request logger        — development aid
 *   7. routes                — each applies its own tighter limiters + validators
 *   8. 404 + error handlers  — JSON errors with no stack trace in production
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

export function createApp() {
  const app = express();

  // If we're behind a reverse proxy, Express needs to trust its headers
  // so req.ip resolves to the real client IP. Rate limiting depends on
  // this. See TRUST_PROXY in .env.example for guidance.
  app.set("trust proxy", env.TRUST_PROXY);

  // Helmet sets a small army of HTTP response headers that protect
  // against clickjacking, MIME sniffing, cross-origin leaks, etc.
  // crossOriginResourcePolicy is relaxed because this API is called
  // from a different origin in dev (Vite on :5173).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS — only our configured frontend origins are allowed. Note that
  // we must echo the request's origin (not "*") because credentials:true
  // requires it. If the origin isn't in the allowlist, we refuse.
  app.use(
    cors({
      origin(origin, cb) {
        // Same-origin requests and non-browser clients (curl, server-side)
        // send no Origin header. Allow those.
        if (!origin) return cb(null, true);
        if (env.CLIENT_URLS.includes(origin)) return cb(null, origin);
        return cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );

  // A hard JSON body size limit stops someone from exhausting memory by
  // posting a 500 MB payload.
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Global cap, with per-route tighter caps layered on top.
  app.use("/api", apiLimiter);

  if (!env.IS_PROD && env.NODE_ENV !== "test") {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Week 10 Task Manager API (hardened)",
    });
  });

  // Lightweight liveness probe — useful behind a load balancer. Does
  // NOT touch the database, so a DB outage doesn't take the pod out of
  // rotation unnecessarily.
  app.get("/healthz", (req, res) => {
    res.status(200).json({ ok: true, env: env.NODE_ENV });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Centralized error handler. We never return stack traces in production
  // (they can leak file paths, library versions, DB field names).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (env.NODE_ENV !== "test") console.error("[error]", err);

    // CORS failure — be explicit so students can debug it.
    if (err?.message?.startsWith("CORS:")) {
      return res.status(403).json({ error: err.message });
    }

    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large" });
    }

    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    const body = { error: "Internal Server Error" };
    if (!env.IS_PROD) {
      body.detail = err?.message;
    }
    res.status(500).json(body);
  });

  return app;
}
