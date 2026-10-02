/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: server/vitest.config.ts
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Spin up an in-memory MongoDB once per test file.
    setupFiles: ["tests/setup.ts"],
    // mongodb-memory-server downloads a binary on first run and can be slow.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Run test files serially. Each file wants its own MongoMemoryServer on
    // its own port, and in a sandboxed environment that can trip over itself.
    // Students can switch to the default (parallel) once they are off the
    // training wheels.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/config/database.ts"],
    },
  },
});
