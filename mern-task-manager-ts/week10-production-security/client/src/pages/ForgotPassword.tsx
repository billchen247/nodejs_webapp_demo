/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/pages/ForgotPassword.tsx
 *
 * "Forgot password?" form.
 *
 * Note what this page does NOT reveal: whether the email exists. The
 * server always responds 200 with `{ ok: true }`. We echo the same
 * neutral "check your inbox" message regardless. That's an anti-user-
 * enumeration measure — if the UI said "no such user" for unknown
 * emails, an attacker could probe to discover which addresses have
 * accounts.
 *
 * In development the server also returns a `devToken` in the response
 * so a student can continue the flow without a real email provider.
 * We render it in a visually loud panel so there's no confusion that
 * this is a dev-only convenience.
 */
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../services/api.js";
import "./AuthForm.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    setDevToken(null);
    try {
      const result = await api.auth.forgotPassword({ email: email.trim() });
      setStatus("sent");
      if (result.devToken) setDevToken(result.devToken);
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not request a reset");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-labelledby="forgot-heading">
      <h2 id="forgot-heading" className="auth-form__title">Reset your password</h2>

      <p className="auth-form__hint">
        Enter the email address on your account. If it matches a user, we
        will send a one-time reset link to that address.
      </p>

      <div className="auth-form__row">
        <label htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      {status === "sent" && (
        <div className="auth-form__success" role="status">
          If an account exists for that email, a reset link has been sent.
          Check your inbox.
        </div>
      )}

      {devToken && (
        <div className="auth-form__dev">
          <strong>Dev-only:</strong> the server returned the reset token
          directly because this is a non-production build. In production,
          this token would arrive by email.
          <code className="auth-form__dev-token">{devToken}</code>
          <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`} className="auth-form__link">
            Continue to reset form →
          </Link>
        </div>
      )}

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send reset link"}
        </button>
        <Link to="/login" className="auth-form__link">
          Back to log in
        </Link>
      </div>
    </form>
  );
}
