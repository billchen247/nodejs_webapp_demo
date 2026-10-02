/**
 * @file vitest.config.js
 * @author Bill Chen
 * @description Vitest config for Week 2. Tests run against the Express app
 *   returned by `createApp()` using `supertest`.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.js"],
      reportsDirectory: "./coverage",
    },
  },
});
