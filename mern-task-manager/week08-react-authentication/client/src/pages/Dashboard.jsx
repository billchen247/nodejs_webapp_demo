/**
 * @file src/pages/Dashboard.jsx
 * @author Bill Chen
 * @description Protected dashboard page shown after sign-in.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <section className="dashboard">
      <h2>Welcome, {user.name}.</h2>
      <p>
        You are signed in with <strong>{user.email}</strong>.
      </p>
      <p>
        <Link className="btn btn--primary" to="/tasks">
          Go to my tasks
        </Link>
      </p>
    </section>
  );
}
