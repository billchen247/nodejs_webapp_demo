import type { User } from "../types/auth";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export type AuthMode = "login" | "register";

interface Props {
    mode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    onAuthenticated: (user: User) => void;
}

export function AuthForm({ mode, onModeChange, onAuthenticated }: Props) {
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
                    onClick={() => onModeChange(isRegistering ? "login" : "register")}
                >
                    {isRegistering ? "Sign in" : "Create an account"}
                </button>
            </p>
        </section>
    );
}
