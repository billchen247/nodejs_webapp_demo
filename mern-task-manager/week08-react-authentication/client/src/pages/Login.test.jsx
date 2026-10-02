/**
 * @file src/pages/Login.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

function renderWithAuth(authValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  it("renders the heading and form fields", () => {
    renderWithAuth({ login: vi.fn() });
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls login with the entered credentials on submit", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ name: "Ada" });
    renderWithAuth({ login });

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "supersecret",
    });
  });

  it("shows an error message when login fails", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error("Invalid email or password"));
    renderWithAuth({ login });

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });
});
