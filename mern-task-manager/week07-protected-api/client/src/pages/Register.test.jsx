/**
 * @file src/pages/Register.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "./Register.jsx";
import { authService } from "../services/authService.js";

vi.mock("../services/authService.js", () => ({
  authService: {
    register: vi.fn(),
  },
}));

describe("Register page", () => {
  beforeEach(() => {
    authService.register.mockReset();
  });

  it("shows a validation error for a short password without calling the service", async () => {
    const user = userEvent.setup();
    render(<Register onAuthenticated={() => {}} onSwitchToLogin={() => {}} />);
    await user.type(screen.getByLabelText(/name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("registers and calls onAuthenticated on success", async () => {
    const createdUser = { id: "1", name: "Ada", email: "ada@example.com" };
    authService.register.mockResolvedValue({ user: createdUser });
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();

    render(<Register onAuthenticated={onAuthenticated} onSwitchToLogin={() => {}} />);
    await user.type(screen.getByLabelText(/name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "super-secret-1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(authService.register).toHaveBeenCalledWith({
      name: "Ada",
      email: "ada@example.com",
      password: "super-secret-1",
    });
    expect(onAuthenticated).toHaveBeenCalledWith(createdUser);
  });

  it("shows a server error message on failure", async () => {
    authService.register.mockRejectedValue(new Error("Email is already in use"));
    const user = userEvent.setup();

    render(<Register onAuthenticated={() => {}} onSwitchToLogin={() => {}} />);
    await user.type(screen.getByLabelText(/name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "dup@example.com");
    await user.type(screen.getByLabelText(/password/i), "super-secret-1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email is already in use/i,
    );
  });

  it("switches to the login view", async () => {
    const onSwitchToLogin = vi.fn();
    const user = userEvent.setup();
    render(<Register onAuthenticated={() => {}} onSwitchToLogin={onSwitchToLogin} />);
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onSwitchToLogin).toHaveBeenCalledOnce();
  });
});
