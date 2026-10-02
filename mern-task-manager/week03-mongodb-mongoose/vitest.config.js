/**
 * @file vitest.config.js
 * @author Bill Chen
 * @description Vitest config for Week 3.
 *
 * We bump the hook timeout because the first run of mongodb-memory-server
 * downloads a MongoDB binary, which can take ~30 seconds on a slow link.
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
