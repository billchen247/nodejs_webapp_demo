/**
 * @file src/pages/Login.test.jsx
 * @author Bill Chen
 * @description Tests for the Login page. AuthProvider calls
 *   authService.me() on mount to bootstrap the session, so we mock the
 *   whole authService module and resolve `me` to "not authenticated"
 *   before exercising the login form itself.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { authService } from "../services/authService.js";

vi.mock("../services/authService.js", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No existing session — AuthProvider's bootstrap call resolves "quietly".
    authService.me.mockResolvedValue({ user: null });
  });

  it("renders the login form", async () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    await waitFor(() => expect(authService.me).toHaveBeenCalled());
  });

  it("calls the auth context's login on submit", async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ user: { name: "Ada", email: "ada@example.com" } });
    renderLogin();
    await waitFor(() => expect(authService.me).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "supersecret",
      })
    );
  });

  it("shows an error message when login rejects", async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue(new Error("Invalid email or password."));
    renderLogin();
    await waitFor(() => expect(authService.me).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });
});
