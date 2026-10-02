/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/vite.config.ts
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the dev server and build tool. @vitejs/plugin-react gives us
// React Fast Refresh in dev and JSX compilation in build.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
