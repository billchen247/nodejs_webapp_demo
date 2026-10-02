/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/tests/Auth.test.tsx
 *
 * Tests for the Login and Register pages. We mock `api.auth` and assert
 * the parent callback fires with the user on success, and that error
 * messages surface on failure.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
}));

import Login from "../src/pages/Login.js";
import Register from "../src/pages/Register.js";
import { api, ApiError } from "../src/services/api.js";

beforeEach(() => {
  vi.mocked(api.auth.register).mockReset();
  vi.mocked(api.auth.login).mockReset();
});

describe("Login page", () => {
  it("submits the form and calls onAuthenticated with the returned user", async () => {
    const user = { id: "1", email: "ada@example.com", name: "Ada" };
    vi.mocked(api.auth.login).mockResolvedValue({ user });
    const onAuth = vi.fn();
    const onSwitch = vi.fn();
    const u = userEvent.setup();

    render(<Login onAuthenticated={onAuth} onSwitchToRegister={onSwitch} />);
    await u.type(screen.getByLabelText(/email/i), "ada@example.com");
    await u.type(screen.getByLabelText(/password/i), "correct horse");
    await u.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith(user));
    expect(api.auth.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct horse",
    });
  });

  it("shows the server-supplied error message on failure", async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new ApiError("Invalid email or password", 401, null),
    );
    const u = userEvent.setup();

    render(<Login onAuthenticated={vi.fn()} onSwitchToRegister={vi.fn()} />);
    await u.type(screen.getByLabelText(/email/i), "x@y.com");
    await u.type(screen.getByLabelText(/password/i), "wrong");
    await u.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i),
    );
  });

  it("invokes onSwitchToRegister when the register link is clicked", async () => {
    const onSwitch = vi.fn();
    const u = userEvent.setup();
    render(<Login onAuthenticated={vi.fn()} onSwitchToRegister={onSwitch} />);
    await u.click(screen.getByRole("button", { name: /register/i }));
    expect(onSwitch).toHaveBeenCalled();
  });
});

describe("Register page", () => {
  it("submits and calls onAuthenticated with the new user", async () => {
    const user = { id: "2", email: "new@example.com", name: "" };
    vi.mocked(api.auth.register).mockResolvedValue({ user });
    const onAuth = vi.fn();
    const u = userEvent.setup();

    render(<Register onAuthenticated={onAuth} onSwitchToLogin={vi.fn()} />);
    await u.type(screen.getByLabelText(/email/i), "new@example.com");
    await u.type(screen.getByLabelText(/^password$/i), "longenough");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith(user));
    expect(api.auth.register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "longenough",
      name: undefined,
    });
  });

  it("rejects a short password without calling the API", async () => {
    const u = userEvent.setup();
    render(<Register onAuthenticated={vi.fn()} onSwitchToLogin={vi.fn()} />);
    await u.type(screen.getByLabelText(/email/i), "a@b.com");
    await u.type(screen.getByLabelText(/^password$/i), "short");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8/i);
    expect(api.auth.register).not.toHaveBeenCalled();
  });

  it("surfaces a 409 conflict from the server", async () => {
    vi.mocked(api.auth.register).mockRejectedValue(
      new ApiError("Email is already registered", 409, null),
    );
    const u = userEvent.setup();

    render(<Register onAuthenticated={vi.fn()} onSwitchToLogin={vi.fn()} />);
    await u.type(screen.getByLabelText(/email/i), "taken@example.com");
    await u.type(screen.getByLabelText(/^password$/i), "longenough");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already registered/i),
    );
  });
});
