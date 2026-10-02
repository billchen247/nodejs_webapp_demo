/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/src/app.ts
 *
 * The Express app factory. New in Week 5: CORS.
 *
 * Why CORS?
 *   The React dev server runs on http://localhost:5173 and the API runs
 *   on http://localhost:3000. Browsers treat those as different "origins"
 *   and will block cross-origin requests unless the API opts in with CORS
 *   headers. The `cors` middleware adds those headers for us.
 *
 * We intentionally allow only the one `CLIENT_URL` origin instead of `*`.
 * `*` is fine for a public read-only API; it will become a security
 * problem the moment we add authentication cookies in Week 6, so we
 * build the right habit now.
 */
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import taskRoutes from "./routes/taskRoutes.js";

export interface CreateAppOptions {
  /** Allowed origin for CORS. Defaults to the Vite dev server URL. */
  clientUrl?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  const clientUrl = options.clientUrl ?? "http://localhost:5173";

  // We pass an array of allowed origins (not a single string). With an
  // array the `cors` library compares the request's `Origin` header and
  // only sets `Access-Control-Allow-Origin` when it matches. Passing a
  // raw string, in contrast, would echo that string back on *every*
  // response — which is still correct CORS behaviour (the browser does
  // the enforcement), but it is more honest to make the allowlist
  // visible in the response headers only when the caller is on the list.
  app.use(cors({ origin: [clientUrl] }));

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to the Week 5 Task Manager API",
      hint: "React UI is served separately by Vite (default http://localhost:5173).",
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
