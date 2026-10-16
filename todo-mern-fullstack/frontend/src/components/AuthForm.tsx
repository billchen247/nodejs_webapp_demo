import { useState } from "react";
import type { User } from "../types/auth";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface Props {
    onAuthenticated: (user: User) => void;
}

export function AuthForm({ onAuthenticated }: Props) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const isRegistering = mode === "register";

    return (
        <section className="auth-panel" aria-labelledby="auth-heading">
            <h2 id="auth-heading">{isRegistering ? "Create your account" : "Sign in"}</h2>
            {isRegistering
                ? <RegisterForm onAuthenticated={onAuthenticated} />
                : <LoginForm onAuthenticated={onAuthenticated} />}
            <p className="auth-switch">
                {isRegistering ? "Already have an account?" : "New here?"}{" "}
                <button
                    type="button"
                    className="auth-switch__button"
                    onClick={() => setMode(isRegistering ? "login" : "register")}
                >
                    {isRegistering ? "Sign in" : "Create an account"}
                </button>
            </p>
        </section>
    );
}
