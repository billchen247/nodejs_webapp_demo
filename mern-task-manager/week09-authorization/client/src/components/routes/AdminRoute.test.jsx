/**
 * @file src/components/routes/AdminRoute.test.jsx
 * @author Bill Chen
 * @description AdminRoute is like ProtectedRoute but also checks
 *   `user.role === "admin"`, redirecting non-admins to /forbidden. Driven
 *   the same way as the ProtectedRoute tests: MemoryRouter + Routes +
 *   AuthContext.Provider.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";

function renderAdmin(value) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/forbidden" element={<div>Forbidden Page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  it("shows a loading indicator while the session is being checked", () => {
    renderAdmin({ isAuthenticated: false, loading: true, user: null });
    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
  });

  it("redirects anonymous visitors to /login", () => {
    renderAdmin({ isAuthenticated: false, loading: false, user: null });
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects authenticated non-admins to /forbidden", () => {
    renderAdmin({
      isAuthenticated: true,
      loading: false,
      user: { name: "Ada", role: "user" },
    });
    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });

  it("renders children for an admin", () => {
    renderAdmin({
      isAuthenticated: true,
      loading: false,
      user: { name: "Root", role: "admin" },
    });
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
