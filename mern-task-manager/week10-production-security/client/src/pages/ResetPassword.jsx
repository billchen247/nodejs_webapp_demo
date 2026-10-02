/**
 * @file src/pages/ResetPassword.jsx
 * @author Bill Chen
 * @description Form to set a new password using the token from the
 *   reset-link URL; validates token presence and password match.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService.js";
import "./AuthForm.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token in URL.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    try {
      await authService.resetPassword(token, password);
      setStatus("done");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2 className="auth__title">Set a new password</h2>
        {status === "done" ? (
          <p className="auth__hint" role="status">
            Password updated. Redirecting to login…
          </p>
        ) : (
          <>
            <p className="auth__subtitle">
              Choose a password at least 8 characters long.
            </p>
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              <div className="auth__field">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="auth__field">
                <label htmlFor="reset-confirm">Confirm password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}

        <p className="auth__switch">
          <Link className="auth__link" to="/login">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}
