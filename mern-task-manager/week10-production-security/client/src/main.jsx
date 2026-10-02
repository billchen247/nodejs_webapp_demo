/**
 * @file src/main.jsx
 * @author Bill Chen
 * @description React entry point — mounts the app inside BrowserRouter and
 *   AuthProvider so routing and auth state are available everywhere.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

// AuthProvider wraps the whole tree, so any page or component can call
// useAuth() and get the current user, login/logout, etc.
// BrowserRouter enables React Router's URL-driven navigation.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
