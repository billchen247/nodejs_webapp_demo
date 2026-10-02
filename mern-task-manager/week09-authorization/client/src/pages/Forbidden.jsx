/**
 * @file src/pages/Forbidden.jsx
 * @author Bill Chen
 * @description Shown when an authenticated user's role doesn't permit a
 *   page (AdminRoute redirects here instead of letting them render /admin).
 */
import { Link } from "react-router-dom";
import "./Forbidden.css";

export default function Forbidden() {
  return (
    <section className="forbidden">
      <h2>Forbidden</h2>
      <p>
        You are signed in, but your account doesn&apos;t have permission to
        view that page.
      </p>
      <p>
        <Link className="btn btn--primary" to="/tasks">
          Back to my tasks
        </Link>
      </p>
    </section>
  );
}
