/**
 * @file src/pages/ResetPassword.test.jsx
 * @author Bill Chen
 * @description Tests the reset-password form's client-side guards (missing
 *   token, mismatched passwords) and the happy path with a token present
 *   in the URL, mocking authService.resetPassword.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "./ResetPassword.jsx";
import { authService } from "../services/authService.js";

vi.mock("../services/authService.js", () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error when the token is missing from the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/new password/i), "longenoughpass");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpass");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/missing reset token in url/i);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("shows an error when the passwords do not match", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc123"]}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/new password/i), "longenoughpass");
    await user.type(screen.getByLabelText(/confirm password/i), "somethingelse");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/passwords do not match/i);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("submits the new password when a token is present", async () => {
    const user = userEvent.setup();
    authService.resetPassword.mockResolvedValue({ message: "ok" });

    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc123"]}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/new password/i), "longenoughpass");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpass");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/password updated/i);
    expect(authService.resetPassword).toHaveBeenCalledWith("abc123", "longenoughpass");
  });
});
