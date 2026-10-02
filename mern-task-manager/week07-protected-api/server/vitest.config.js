/**
 * @file vitest.config.js
 * @author Bill Chen
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // JWT_SECRET must exist before src/config/auth.js is imported (it
    // signs/verifies tokens at call time), so we set it here rather than
    // relying on a .env file during tests.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret-do-not-use-in-production",
      JWT_EXPIRES_IN: "7d",
      CLIENT_URL: "http://localhost:5173",
    },
    include: ["tests/**/*.test.js"],
    hookTimeout: 60_000,
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reportsDirectory: "./coverage",
    },
  },
});
