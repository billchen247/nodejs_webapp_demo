/**
 * @file src/pages/Register.jsx
 * @author Bill Chen
 */
import { useState } from "react";
import { authService } from "../services/authService.js";
import "./AuthForm.css";

export default function Register({ onAuthenticated, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { user } = await authService.register({ name, email, password });
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
        <h2 className="auth__title">Create your account</h2>
        <p className="auth__subtitle">It takes about ten seconds.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__field">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="auth__hint">At least 8 characters.</small>
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
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account?{" "}
          <button className="auth__link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </section>
  );
}
