/**
 * @file src/pages/HomeLanding.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeLanding from "./HomeLanding.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

function renderWithAuth(authValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <HomeLanding />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("HomeLanding", () => {
  it("renders the heading", () => {
    renderWithAuth({ isAuthenticated: false, user: null });
    expect(
      screen.getByRole("heading", { name: /a tiny task manager/i }),
    ).toBeInTheDocument();
  });

  it("shows sign in / create account links when anonymous", () => {
    renderWithAuth({ isAuthenticated: false, user: null });
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create an account/i })).toBeInTheDocument();
  });

  it("greets the user and links to tasks when authenticated", () => {
    renderWithAuth({ isAuthenticated: true, user: { name: "Ada" } });
    expect(screen.getByText(/ada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /your tasks/i })).toBeInTheDocument();
  });
});
