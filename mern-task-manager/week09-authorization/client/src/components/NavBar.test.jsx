/**
 * @file src/components/NavBar.test.jsx
 * @author Bill Chen
 * @description NavBar reads auth state via useAuth(), so tests render it
 *   inside a MemoryRouter (for NavLink) and an AuthContext.Provider with a
 *   hand-built value instead of exercising the real AuthProvider/network.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

function renderWithAuth(value) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <NavBar />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("NavBar", () => {
  it("shows Log in / Sign up links for an anonymous visitor", () => {
    renderWithAuth({ user: null, isAuthenticated: false, logout: vi.fn() });
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  it("shows Tasks and the user's name for a signed-in regular user, but hides Admin", () => {
    renderWithAuth({
      user: { name: "Ada", email: "ada@example.com", role: "user" },
      isAuthenticated: true,
      logout: vi.fn(),
    });
    expect(screen.getByRole("link", { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  it("shows the Admin link and badge for an admin user", () => {
    renderWithAuth({
      user: { name: "Root", email: "root@example.com", role: "admin" },
      isAuthenticated: true,
      logout: vi.fn(),
    });
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("calls logout when the Log out button is clicked", async () => {
    const logout = vi.fn();
    const user = userEvent.setup();
    renderWithAuth({
      user: { name: "Ada", email: "ada@example.com", role: "user" },
      isAuthenticated: true,
      logout,
    });
    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
