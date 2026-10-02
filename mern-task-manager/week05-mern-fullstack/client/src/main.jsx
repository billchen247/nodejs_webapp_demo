/**
 * @file src/main.jsx
 * @author Bill Chen
 * @description React entry point — mounts <App /> into the #root element.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
