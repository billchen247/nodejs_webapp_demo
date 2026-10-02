/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/pages/Register.tsx
 *
 * The sibling of Login. On success the backend sets the auth cookie
 * *and* the AuthContext stores the user, so we send the user straight
 * to /tasks instead of asking them to log in again.
 */
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
import "./AuthForm.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      navigate("/tasks", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-labelledby="register-heading">
      <h2 id="register-heading" className="auth-form__title">Create an account</h2>

      <div className="auth-form__row">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-form__row">
        <label htmlFor="register-name">Name (optional)</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="auth-form__row">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <small className="auth-form__hint">At least 8 characters.</small>
      </div>

      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <Link to="/login" className="auth-form__link">
          Already have an account? Log in
        </Link>
      </div>
    </form>
  );
}
