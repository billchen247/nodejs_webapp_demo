/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/pages/Login.tsx
 *
 * The login form, now wired to AuthContext + React Router. The pattern
 * is:
 *
 *   1. Call `login()` on the context — it hits the API and updates
 *      global state on success.
 *   2. Read `location.state.from` to figure out where the user was
 *      trying to go before being bounced here, defaulting to /tasks.
 *   3. Navigate there with `replace` so the back button doesn't send
 *      the user back to /login.
 */
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { ApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
import "./AuthForm.css";

interface LocationState {
  from?: Location;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Where were we trying to go before being bounced here? If nothing, /tasks.
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/tasks";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
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
        <Link to="/register" className="auth-form__link">
          Need an account? Register
        </Link>
        <Link to="/forgot-password" className="auth-form__link">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
