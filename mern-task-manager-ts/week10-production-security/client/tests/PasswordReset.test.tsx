/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/tests/PasswordReset.test.tsx
 *
 * Tests for the Week 10 forgot-password / reset-password pages.
 *
 * The forgot-password page's main user-facing contract is "never reveal
 * whether the email exists" — so we verify the UI shows the same
 * neutral success message in either case.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
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

import ForgotPassword from "../src/pages/ForgotPassword.js";
import ResetPassword from "../src/pages/ResetPassword.js";
import { api, ApiError } from "../src/services/api.js";

beforeEach(() => {
  vi.mocked(api.auth.forgotPassword).mockReset();
  vi.mocked(api.auth.resetPassword).mockReset();
});

function renderAt(initial: string, element: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/forgot-password" element={element} />
        <Route path="/reset-password" element={element} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ForgotPassword", () => {
  it("submits the email and shows a neutral success message", async () => {
    vi.mocked(api.auth.forgotPassword).mockResolvedValue({ ok: true });
    const u = userEvent.setup();
    renderAt("/forgot-password", <ForgotPassword />);

    await u.type(screen.getByLabelText(/email/i), "unknown@example.com");
    await u.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /if an account exists for that email/i,
      ),
    );
    expect(api.auth.forgotPassword).toHaveBeenCalledWith({
      email: "unknown@example.com",
    });
  });

  it("renders the dev token when the server provides one", async () => {
    vi.mocked(api.auth.forgotPassword).mockResolvedValue({ ok: true, devToken: "deadbeef" });
    const u = userEvent.setup();
    renderAt("/forgot-password", <ForgotPassword />);

    await u.type(screen.getByLabelText(/email/i), "a@b.com");
    await u.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText("deadbeef")).toBeInTheDocument(),
    );
    const continueLink = screen.getByRole("link", { name: /continue to reset form/i });
    expect(continueLink).toHaveAttribute(
      "href",
      "/reset-password?token=deadbeef",
    );
  });

  it("surfaces API errors", async () => {
    vi.mocked(api.auth.forgotPassword).mockRejectedValue(
      new ApiError("Too many requests", 429, null),
    );
    const u = userEvent.setup();
    renderAt("/forgot-password", <ForgotPassword />);

    await u.type(screen.getByLabelText(/email/i), "a@b.com");
    await u.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/too many/i),
    );
  });
});

describe("ResetPassword", () => {
  it("sends the token + new password and navigates to /login", async () => {
    vi.mocked(api.auth.resetPassword).mockResolvedValue({ ok: true });
    const u = userEvent.setup();
    renderAt("/reset-password?token=good-token", <ResetPassword />);

    await u.type(screen.getByLabelText(/^new password$/i), "a-good-password");
    await u.type(screen.getByLabelText(/confirm new password/i), "a-good-password");
    await u.click(screen.getByRole("button", { name: /set new password/i }));

    await waitFor(() =>
      expect(screen.getByTestId("login-page")).toBeInTheDocument(),
    );
    expect(api.auth.resetPassword).toHaveBeenCalledWith({
      token: "good-token",
      newPassword: "a-good-password",
    });
  });

  it("refuses mismatched passwords without calling the API", async () => {
    const u = userEvent.setup();
    renderAt("/reset-password?token=good-token", <ResetPassword />);

    await u.type(screen.getByLabelText(/^new password$/i), "a-good-password");
    await u.type(screen.getByLabelText(/confirm new password/i), "a-different-one");
    await u.click(screen.getByRole("button", { name: /set new password/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i);
    expect(api.auth.resetPassword).not.toHaveBeenCalled();
  });

  it("shows an error when the URL has no token", async () => {
    renderAt("/reset-password", <ResetPassword />);
    expect(screen.getByRole("alert")).toHaveTextContent(/missing reset token/i);
    expect(screen.getByRole("button", { name: /set new password/i })).toBeDisabled();
  });
});
