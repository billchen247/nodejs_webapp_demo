/**
 * @file src/pages/Login.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login.jsx";
import { authService } from "../services/authService.js";

vi.mock("../services/authService.js", () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe("Login page", () => {
  beforeEach(() => {
    authService.login.mockReset();
  });

  it("calls onAuthenticated with the logged-in user on success", async () => {
    const loggedInUser = { id: "1", name: "Ada", email: "ada@example.com" };
    authService.login.mockResolvedValue({ user: loggedInUser });
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();

    render(<Login onAuthenticated={onAuthenticated} onSwitchToRegister={() => {}} />);
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "super-secret-1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authService.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "super-secret-1",
    });
    expect(onAuthenticated).toHaveBeenCalledWith(loggedInUser);
  });

  it("shows an error message when login fails", async () => {
    authService.login.mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();

    render(<Login onAuthenticated={() => {}} onSwitchToRegister={() => {}} />);
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-pass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid email or password/i,
    );
  });

  it("switches to the register view", async () => {
    const onSwitchToRegister = vi.fn();
    const user = userEvent.setup();
    render(<Login onAuthenticated={() => {}} onSwitchToRegister={onSwitchToRegister} />);
    await user.click(screen.getByRole("button", { name: /create one/i }));
    expect(onSwitchToRegister).toHaveBeenCalledOnce();
  });
});
