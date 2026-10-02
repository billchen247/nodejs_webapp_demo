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

  it("renders the sign-in form", () => {
    render(<Login onAuthenticated={() => {}} onSwitchToRegister={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls authService.login and onAuthenticated on success", async () => {
    authService.login.mockResolvedValue({
      user: { id: "1", name: "Ada", email: "ada@example.com" },
    });
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();
    render(<Login onAuthenticated={onAuthenticated} onSwitchToRegister={() => {}} />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authService.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct-horse",
    });
    expect(onAuthenticated).toHaveBeenCalledWith({
      id: "1",
      name: "Ada",
      email: "ada@example.com",
    });
  });

  it("shows an error message when login fails", async () => {
    authService.login.mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();
    render(<Login onAuthenticated={() => {}} onSwitchToRegister={() => {}} />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid email or password/i,
    );
  });

  it("switches to the register view", async () => {
    const onSwitchToRegister = vi.fn();
    const user = userEvent.setup();
    render(
      <Login onAuthenticated={() => {}} onSwitchToRegister={onSwitchToRegister} />,
    );
    await user.click(screen.getByRole("button", { name: /create one/i }));
    expect(onSwitchToRegister).toHaveBeenCalled();
  });
});
