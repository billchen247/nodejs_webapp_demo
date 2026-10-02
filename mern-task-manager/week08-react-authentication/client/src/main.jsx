/**
 * @file src/main.jsx
 * @author Bill Chen
 * @description Entry point for the React application. Wraps the tree in
 *   `BrowserRouter` (URL-driven navigation) and `AuthProvider` (auth state).
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
