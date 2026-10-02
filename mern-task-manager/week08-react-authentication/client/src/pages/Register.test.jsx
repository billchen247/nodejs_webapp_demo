/**
 * @file src/pages/Register.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

function renderWithAuth(authValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <Register />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("Register page", () => {
  it("renders the heading and form fields", () => {
    renderWithAuth({ register: vi.fn() });
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows a validation error for a short password without calling register", async () => {
    const user = userEvent.setup();
    const register = vi.fn();
    renderWithAuth({ register });

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(register).not.toHaveBeenCalled();
  });

  it("calls register with the entered details on submit", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue({ name: "Ada Lovelace" });
    renderWithAuth({ register });

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(register).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });
  });
});
