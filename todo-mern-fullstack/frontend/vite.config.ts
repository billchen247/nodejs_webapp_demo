/* =============================================================================
 * vite.config.ts — Vite build + dev-server configuration
 * =============================================================================
 *
 * Vite is three things in one tool:
 *   • Dev server with blazing-fast HMR (uses native ESM in the browser).
 *   • Production bundler (built on Rollup).
 *   • Preview server (`vite preview`) to try out a prod build locally.
 *
 * The important bit here is the **proxy**. The React app runs on :5173 and
 * the API runs on :4000. Instead of hard-coding `http://localhost:4000/api`
 * in frontend code, we point the browser at relative URLs (`/api/...`) and
 * let Vite forward them to Express in dev. In production you'd typically
 * put a real reverse-proxy (nginx, Caddy, your hosting platform) in front.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // Any request that STARTS with /api gets forwarded to the backend.
            // The browser URL stays "/api/todos" — only the hop from Vite to
            // Express changes.
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
});
