/**
 * @file src/config/env.js
 * @author Bill Chen
 * @description Centralized environment validation.
 *   Fail fast: if the server starts in production without a strong
 *   JWT_SECRET we want it to refuse to boot — not run silently insecure.
 */

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

function readIntEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Env var ${name} must be a number, got "${raw}"`);
  }
  return n;
}

function readListEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  NODE_ENV,
  IS_PROD,
  PORT: readIntEnv("PORT", 5000),
  TRUST_PROXY: readIntEnv("TRUST_PROXY", 0),

  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/taskmanager",

  CLIENT_URLS: readListEnv("CLIENT_URLS", ["http://localhost:5173"]),

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  PASSWORD_RESET_TTL_MINUTES: readIntEnv("PASSWORD_RESET_TTL_MINUTES", 30),
  PASSWORD_RESET_URL_BASE:
    process.env.PASSWORD_RESET_URL_BASE || "http://localhost:5173/reset-password",

  RATE_LIMIT_WINDOW_SECONDS: readIntEnv("RATE_LIMIT_WINDOW_SECONDS", 15 * 60),
  RATE_LIMIT_MAX: readIntEnv("RATE_LIMIT_MAX", 300),
  AUTH_RATE_LIMIT_MAX: readIntEnv("AUTH_RATE_LIMIT_MAX", 10),
});

export function assertSafeEnvOrExit() {
  const problems = [];

  if (!env.JWT_SECRET) {
    problems.push("JWT_SECRET is not set.");
  } else if (
    env.JWT_SECRET === "replace-with-a-long-random-secret" ||
    env.JWT_SECRET.length < 32
  ) {
    problems.push(
      "JWT_SECRET is weak or still the example placeholder (needs >= 32 chars)."
    );
  }

  if (env.IS_PROD && env.CLIENT_URLS.some((u) => u.startsWith("http://"))) {
    problems.push(
      "CLIENT_URLS contains an http:// origin while NODE_ENV=production — use https."
    );
  }

  if (problems.length === 0) return;

  const header = env.IS_PROD
    ? "FATAL: unsafe production config:"
    : "WARNING: insecure development config:";
  console.error(header);
  for (const p of problems) console.error(`  - ${p}`);

  if (env.IS_PROD) {
    process.exit(1);
  }
}
