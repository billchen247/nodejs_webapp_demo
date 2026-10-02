/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: vitest.config.ts
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      // The server bootstrap just calls app.listen — not interesting to cover.
      exclude: ["src/server.ts"],
    },
  },
});
