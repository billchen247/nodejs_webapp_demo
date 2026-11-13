import { useEffect, useState } from "react";
import "./App.css";

import { authApi } from "./api/auth";
import { AuthenticatedApp } from "./components/AuthenticatedApp";
import { GuestApp } from "./components/GuestApp";
import type { User } from "./types/auth";

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        void authApi.profile()
            .then(({ user: profile }) => {
                if (active) setUser(profile);
            })
            .catch((err: unknown) => {
                if (active && err instanceof Error && err.message !== "Authentication required.") {
                    setAuthError(err.message);
                }
            })
            .finally(() => {
                if (active) setAuthLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    if (authLoading) {
        return (
            <main className="app app--loading">
                <p role="status">Checking your session…</p>
            </main>
        );
    }

    if (!user) {
        return (
            <GuestApp
                authError={authError}
                onAuthenticated={(loginedUser) => {
                    setAuthError(null);
                    setUser(loginedUser);
                }}
            />
        );
    }

    return <AuthenticatedApp user={user} onLogout={() => setUser(null)} />;
}
