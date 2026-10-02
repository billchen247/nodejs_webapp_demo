/**
 * @file src/pages/Register.test.jsx
 * @author Bill Chen
 * @description Tests for the Register page's client-side password-length
 *   validation. authService is mocked so AuthProvider's mount-time
 *   me() call resolves without hitting a real network.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register.jsx";
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

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.me.mockResolvedValue({ user: null });
  });

  it("renders the registration form", async () => {
    renderRegister();
    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    await waitFor(() => expect(authService.me).toHaveBeenCalled());
  });

  it("shows a client-side error for short passwords without calling the service", async () => {
    const user = userEvent.setup();
    renderRegister();
    await waitFor(() => expect(authService.me).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /password must be at least 8 characters/i
    );
    expect(authService.register).not.toHaveBeenCalled();
  });
});
