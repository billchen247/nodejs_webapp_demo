/**
 * @file src/main.jsx
 * @author Bill Chen
 * @description Entry point for the React application.
 *
 * `createRoot` is the React 18 way to mount a component tree. `StrictMode`
 * is a dev-only wrapper that double-invokes effects/renders to surface
 * side-effect bugs early — it has no cost in production builds.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
