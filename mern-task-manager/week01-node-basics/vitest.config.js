/**
 * @file vitest.config.js
 * @author Bill Chen
 * @description Vitest configuration for Week 1.
 *   `environment: "node"` tells Vitest we're testing Node code (not a
 *   browser/DOM). Coverage uses the v8 provider and emits text + HTML
 *   reports under `./coverage/`.
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
