/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 01
 * File: vitest.config.ts
 *
 * Vitest configuration.
 *
 * Why Vitest?
 *   Vitest understands TypeScript and ES Modules out of the box, which
 *   lets students focus on writing tests rather than configuring Babel
 *   or ts-jest. The API is very close to Jest, so the knowledge transfers.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Make describe/it/expect available without importing them in every test file.
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      // v8 coverage is built into Node and does not require a separate instrumenter.
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"], // The server bootstrap is tested indirectly through integration-style tests.
    },
  },
});
