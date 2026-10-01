/* =============================================================================
 * src/main.tsx — the React bootstrap
 * =============================================================================
 *
 * `index.html` loads this file. Here we:
 *   1. Find the `<div id="root">` in the HTML.
 *   2. Create a React root with `createRoot` (React 18+ API).
 *   3. Render `<App />` inside `<StrictMode>`.
 *
 * `<StrictMode>` is a dev-only wrapper that intentionally runs effects twice
 * on mount to help you catch impure code. It emits no extra DOM in production.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
    // If this ever throws, your `index.html` is missing <div id="root">.
    throw new Error("Missing #root element in index.html");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
