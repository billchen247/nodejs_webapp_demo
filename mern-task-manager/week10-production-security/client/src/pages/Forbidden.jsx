/**
 * @file src/pages/Forbidden.jsx
 * @author Bill Chen
 * @description Shown when a signed-in user lacks permission (e.g. a
 *   non-admin hitting /admin); offers a way back into the app.
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
