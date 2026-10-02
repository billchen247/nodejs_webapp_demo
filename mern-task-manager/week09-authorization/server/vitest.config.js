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
    // JWT_SECRET must exist before src/config/auth.js is first imported,
    // so we set it here rather than relying on a .env file in CI.
    env: {
      JWT_SECRET: "test-only-secret-do-not-use-in-production",
      JWT_EXPIRES_IN: "7d",
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
