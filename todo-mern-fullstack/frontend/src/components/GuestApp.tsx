import { useState } from "react";
import { AuthForm, type AuthMode } from "./AuthForm";
import { NavigationBar } from "./NavigationBar";
import type { User } from "../types/auth";

interface Props {
    authError: string | null;
    onAuthenticated: (user: User) => void;
}

export function GuestApp({ authError, onAuthenticated }: Props) {
    const [authMode, setAuthMode] = useState<AuthMode>("login");

    return (
        <div id="guest-app">
            <NavigationBar
                mode="guest"
                activeAuthMode={authMode}
                onSelectAuthMode={setAuthMode}
            />
            <main className="app" id="home">
                <header className="app__header">
                    <h1>Todo — MERN Fullstack</h1>
                    <p className="app__subtitle">Sign in or register to manage your todos.</p>
                </header>
                {authError && <div role="alert" className="app__error">{authError}</div>}
                <AuthForm
                    mode={authMode}
                    onModeChange={setAuthMode}
                    onAuthenticated={onAuthenticated}
                />
            </main>
        </div>
    );
}
