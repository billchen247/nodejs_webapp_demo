/**
 * @file src/pages/Login.jsx
 * @author Bill Chen
 * @description Login page. On success, navigates to the page the user was
 *   trying to reach before ProtectedRoute redirected them (or /tasks).
 */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthForm.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.from?.pathname || "/tasks";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(nextPath, { replace: true });
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
          <a className="auth__link" href="/register">
            Create one
          </a>
        </p>
      </div>
    </section>
  );
}
