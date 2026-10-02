/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/vitest.config.ts
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config separate from Vite config so test-only settings
// (jsdom, globals, setup file) do not leak into production builds.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // React components need a browser-like DOM. jsdom gives us one in Node.
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
    },
  },
});
