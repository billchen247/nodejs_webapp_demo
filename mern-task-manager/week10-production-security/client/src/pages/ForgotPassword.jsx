/**
 * @file src/pages/ForgotPassword.jsx
 * @author Bill Chen
 * @description Form to request a password reset link; shows the server's
 *   response message (success or error) in place.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService.js";
import "./AuthForm.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const data = await authService.forgotPassword(email);
      setMessage(data.message);
      setStatus("done");
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2 className="auth__title">Forgot your password?</h2>
        <p className="auth__subtitle">
          Enter your email and we&apos;ll send a reset link. (In this demo,
          the link is printed to the server console.)
        </p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting" || status === "done"}
            />
          </div>

          {message ? (
            <p
              className={status === "error" ? "auth__error" : "auth__hint"}
              role={status === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary auth__submit"
            disabled={status === "submitting" || status === "done"}
          >
            {status === "submitting" ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="auth__switch">
          Remembered it?{" "}
          <Link className="auth__link" to="/login">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}
