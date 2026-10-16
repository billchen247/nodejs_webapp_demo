import { useState, type FormEvent } from "react";
import { authApi } from "../api/auth";
import type { User } from "../types/auth";

interface Props {
    onAuthenticated: (user: User) => void;
}

export function RegisterForm({ onAuthenticated }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const { user } = await authApi.register({ name, email, password });
            onAuthenticated(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <label>
                Name
                <input
                    autoComplete="name"
                    maxLength={100}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            <label>
                Email
                <input
                    autoComplete="email"
                    type="email"
                    maxLength={254}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            <label>
                Password
                <input
                    autoComplete="new-password"
                    type="password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            {error && <div role="alert" className="app__error">{error}</div>}
            <button type="submit" disabled={submitting}>
                {submitting ? "Please wait…" : "Register"}
            </button>
        </form>
    );
}
