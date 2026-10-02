/**
 * @file vitest.config.js
 * @author Bill Chen
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    hookTimeout: 60_000,
    testTimeout: 20_000,
    // Set BEFORE any test file (or the src/config/env.js it imports) is
    // evaluated — env.js reads these into a frozen object at import time,
    // so setting them later (e.g. inside tests/setup.js) would be too late.
    env: {
      JWT_SECRET: "test-only-secret-at-least-32-characters-long",
      CLIENT_URLS: "http://localhost:5173",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reportsDirectory: "./coverage",
    },
  },
});
