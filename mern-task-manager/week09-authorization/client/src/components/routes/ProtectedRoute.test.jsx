/**
 * @file src/components/routes/ProtectedRoute.test.jsx
 * @author Bill Chen
 * @description ProtectedRoute renders a loading state, redirects anonymous
 *   visitors to /login, and otherwise renders its children. Tests drive it
 *   with a MemoryRouter + Routes (so <Navigate> has somewhere real to go)
 *   and an AuthContext.Provider carrying a hand-built auth value.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";

function renderProtected(value) {
  return render(
    <MemoryRouter initialEntries={["/secret"]}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <div>Secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading indicator while the session is being checked", () => {
    renderProtected({ isAuthenticated: false, loading: true });
    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
  });

  it("redirects to /login when not authenticated", () => {
    renderProtected({ isAuthenticated: false, loading: false });
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    renderProtected({ isAuthenticated: true, loading: false });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
