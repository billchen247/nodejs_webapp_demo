/**
 * @file src/pages/ForgotPassword.test.jsx
 * @author Bill Chen
 * @description Tests the forgot-password form, mocking authService's
 *   network call and asserting the returned message is displayed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "./ForgotPassword.jsx";
import { authService } from "../services/authService.js";

vi.mock("../services/authService.js", () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the returned message after submitting", async () => {
    const user = userEvent.setup();
    authService.forgotPassword.mockResolvedValue({
      message: "If that email exists, a reset link was sent.",
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/if that email exists, a reset link was sent/i)).toBeInTheDocument();
    expect(authService.forgotPassword).toHaveBeenCalledWith("ada@example.com");
  });
});
