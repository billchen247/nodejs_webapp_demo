/**
 * @file src/pages/Login.jsx
 * @author Bill Chen
 * @description Login form. On success, calls `onAuthenticated(user)` so
 *   the parent (App) can store the signed-in user.
 */
import { useState } from "react";
import { authService } from "../services/authService.js";
import "./AuthForm.css";

export default function Login({ onAuthenticated, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { user } = await authService.login({ email, password });
      onAuthenticated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2 className="auth__title">Welcome back</h2>
        <p className="auth__subtitle">Log in to see your tasks.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p className="auth__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary auth__submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth__switch">
          No account?{" "}
          <button className="auth__link" onClick={onSwitchToRegister}>
            Create one
          </button>
        </p>
      </div>
    </section>
  );
}
