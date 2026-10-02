/**
 * @file src/components/routes/ProtectedRoute.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";

function renderProtected(authValue, initialPath = "/tasks") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <p>Secret tasks</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while the session is being checked", () => {
    renderProtected({ isAuthenticated: false, loading: true });
    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
  });

  it("redirects to /login when not authenticated", () => {
    renderProtected({ isAuthenticated: false, loading: false });
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it("renders the protected content when authenticated", () => {
    renderProtected({ isAuthenticated: true, loading: false });
    expect(screen.getByText(/secret tasks/i)).toBeInTheDocument();
  });
});
