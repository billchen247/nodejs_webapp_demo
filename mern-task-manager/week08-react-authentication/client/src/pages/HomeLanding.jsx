/**
 * @file src/pages/HomeLanding.jsx
 * @author Bill Chen
 * @description Public landing page. If a user is already signed in, we
 *   point them into the app; otherwise we point them at login/register.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./HomeLanding.css";

export default function HomeLanding() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="landing">
      <h2 className="landing__title">A tiny task manager</h2>
      <p className="landing__lede">
        Built one week at a time to teach modern MERN development.
      </p>

      {isAuthenticated ? (
        <p>
          Hi, <strong>{user.name}</strong>. Head to{" "}
          <Link to="/tasks" className="landing__cta">
            your tasks
          </Link>
          .
        </p>
      ) : (
        <div className="landing__cta-row">
          <Link to="/login" className="btn btn--primary">
            Sign in
          </Link>
          <Link to="/register" className="btn btn--ghost">
            Create an account
          </Link>
        </div>
      )}
    </section>
  );
}
