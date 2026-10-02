/**
 * @file vite.config.js
 * @author Bill Chen
 * @description Vite + Vitest configuration for the Week 7 React client.
 *
 * Vite is the dev server + bundler for our React app. By default it serves
 * on http://localhost:5173. We also configure Vitest here (same config
 * surface) with jsdom + the Testing Library setup file.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.test.{js,jsx}",
        "src/test/**",
        "src/main.jsx",
      ],
      reportsDirectory: "./coverage",
    },
  },
});
