/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/pages/ResetPassword.tsx
 *
 * The "set a new password" form, reached from the reset link.
 *
 * The token comes in via the URL (`?token=...`). We let the server tell
 * us if it's valid rather than pre-checking — the token is single-use
 * and a probe to verify it would consume it.
 *
 * On success we navigate to /login. We deliberately do NOT log the user
 * in automatically here: making them sign in afterwards is a small UX
 * cost in exchange for a simpler threat model.
 */
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../services/api.js";
import "./AuthForm.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset token. Open the link from your email again.");
      return;
    }
    if (password !== confirm) {
      // Local mismatch — don't send to the server, it won't help.
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api.auth.resetPassword({ token, newPassword: password });
      navigate("/login?reset=1", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-labelledby="reset-heading">
      <h2 id="reset-heading" className="auth-form__title">Choose a new password</h2>

      {!token && (
        <div className="auth-form__error" role="alert">
          Missing reset token. Open the link from your email again.
        </div>
      )}

      <div className="auth-form__row">
        <label htmlFor="reset-password">New password</label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="auth-form__row">
        <label htmlFor="reset-confirm">Confirm new password</label>
        <input
          id="reset-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={submitting || !token}>
          {submitting ? "Resetting…" : "Set new password"}
        </button>
        <Link to="/login" className="auth-form__link">
          Back to log in
        </Link>
      </div>
    </form>
  );
}
