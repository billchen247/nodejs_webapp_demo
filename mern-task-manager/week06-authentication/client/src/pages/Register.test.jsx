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

  it("renders the registration form", () => {
    render(<Register onAuthenticated={() => {}} onSwitchToLogin={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("rejects a short password before calling the service", async () => {
    const user = userEvent.setup();
    render(<Register onAuthenticated={() => {}} onSwitchToLogin={() => {}} />);

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("calls authService.register and onAuthenticated on success", async () => {
    authService.register.mockResolvedValue({
      user: { id: "1", name: "Ada Lovelace", email: "ada@example.com" },
    });
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();
    render(
      <Register onAuthenticated={onAuthenticated} onSwitchToLogin={() => {}} />,
    );

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(authService.register).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });
    expect(onAuthenticated).toHaveBeenCalledWith({
      id: "1",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("shows a server error message when registration fails", async () => {
    authService.register.mockRejectedValue(new Error("Email is already in use"));
    const user = userEvent.setup();
    render(<Register onAuthenticated={() => {}} onSwitchToLogin={() => {}} />);

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email is already in use/i,
    );
  });
});
