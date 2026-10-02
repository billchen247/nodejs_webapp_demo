/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: client/src/pages/Login.tsx
 *
 * A minimal login form.
 *
 * It calls `api.auth.login`, surfaces an error inline on failure, and
 * notifies the parent on success by calling `onAuthenticated`. The
 * parent (App) uses that callback to refresh its view of the current
 * user. Week 8 will replace this hand-rolled plumbing with React Router
 * and an AuthContext.
 */
import { useState, type FormEvent } from "react";
import { api, ApiError } from "../services/api.js";
import type { AuthUser } from "../types.js";
import "./AuthForm.css";

interface LoginProps {
  onAuthenticated: (user: AuthUser) => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onAuthenticated, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await api.auth.login({ email: email.trim(), password });
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-labelledby="login-heading">
      <h2 id="login-heading" className="auth-form__title">Log in</h2>

      <div className="auth-form__row">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-form__row">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <button
          type="button"
          className="auth-form__link"
          onClick={onSwitchToRegister}
        >
          Need an account? Register
        </button>
      </div>
    </form>
  );
}
