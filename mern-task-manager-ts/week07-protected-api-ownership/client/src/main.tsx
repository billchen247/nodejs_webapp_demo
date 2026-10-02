/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/src/main.tsx
 *
 * The React entry point. One job: find the <div id="root"> in index.html
 * and mount the <App /> component inside it.
 *
 * We wrap in React.StrictMode so the dev-time hooks run twice. That is
 * deliberately noisy — it surfaces side-effect bugs early.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  // If this fires, index.html is wrong. Loud failure is kinder than silence.
  throw new Error("Could not find #root element in index.html");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
