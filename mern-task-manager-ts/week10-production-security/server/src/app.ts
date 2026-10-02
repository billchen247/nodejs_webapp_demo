/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/app.ts
 *
 * The Week 10 app wires in production-grade security middleware.
 *
 *   1. `helmet()` sets a safe baseline of security headers:
 *      X-Content-Type-Options: nosniff, X-Frame-Options: DENY (via the
 *      Content-Security-Policy frame-ancestors), Strict-Transport-Security
 *      (when behind HTTPS), and others. Default-on is the right default.
 *
 *   2. `app.set("trust proxy", 1)` tells Express to trust the first hop
 *      of X-Forwarded-For. Rate limiters key off `req.ip`, which must be
 *      the client's address, not the load balancer's. Without this, a
 *      single reverse proxy would appear to make every request, and
 *      every user shares one rate-limit bucket. Only trust proxies you
 *      control.
 *
 *   3. `generalLimiter` on everything that is not /api/auth, plus a
 *      strict `authLimiter` already installed inside authRoutes.ts.
 *
 *   4. The error handler no longer leaks stack traces in production.
 *      Development callers still get the stack to help diagnose bugs.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { isProd } from "./config/security.js";

export interface CreateAppOptions {
  clientUrl?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  const clientUrl = options.clientUrl ?? "http://localhost:5173";

  // Trust the first proxy hop so rate limiters see the real client IP.
  // 1 = "trust exactly one reverse proxy in front of this app".
  app.set("trust proxy", 1);

  // Security headers first — before any route handler can decide to
  // send a response. Helmet's defaults are safe; we only override the
  // ones that would clash with a JSON API served to a separate SPA.
  app.use(
    helmet({
      // Our API returns JSON, never HTML with embedded scripts. There
      // is no useful CSP to apply, and the default CSP blocks Swagger
      // UI / docs tools during local dev. Disable it here and apply
      // CSP on the frontend host instead.
      contentSecurityPolicy: false,
      // Allow the SPA on a different origin to read cross-origin
      // resources (JSON responses). COEP is only needed for pages that
      // host shared array buffers, which the API never does.
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cors({ origin: [clientUrl], credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Looser limiter for the whole API; `authRoutes` applies the strict
  // limiter on top of this for login/register/forgot/reset.
  app.use(generalLimiter);

  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 10 Task Manager API",
      hint: "Security hardening: helmet, rate limiting, zod validation, refresh tokens, password reset.",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // Always log on the server — operators need the stack.
    // Never leak the stack to the client in production — attackers do not.
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    const body: Record<string, unknown> = { error: "Internal Server Error" };
    if (!isProd() && err instanceof Error) {
      body.message = err.message;
      body.stack = err.stack;
    }
    res.status(500).json(body);
  });

  return app;
}
