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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reportsDirectory: "./coverage",
    },
  },
});
