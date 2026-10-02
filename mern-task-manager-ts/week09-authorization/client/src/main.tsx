/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/main.tsx
 *
 * The React entry point. New in Week 8:
 *   - Wraps <App /> in <BrowserRouter> so URL-based routing works.
 *   - <App /> itself does not mount a router — tests do that with
 *     <MemoryRouter> instead. One router per tree, always.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Could not find #root element in index.html");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
