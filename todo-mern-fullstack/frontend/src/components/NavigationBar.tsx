import type { AuthMode } from "./AuthForm";
import type { User } from "../types/auth";

type Props =
    | {
        mode: "guest";
        activeAuthMode: AuthMode;
        onSelectAuthMode: (mode: AuthMode) => void;
    }
    | {
        mode: "authenticated";
        user: User;
        onLogout: () => void;
    };

export function NavigationBar(props: Props) {
    return (
        <nav className="top-nav" aria-label="Main navigation">
            <div className="top-nav__inner">
                <a className="top-nav__brand" href={props.mode === "guest" ? "#home" : "#todos"}>
                    Todo App
                </a>

                {props.mode === "guest" ? (
                    <div className="top-nav__menu">
                        <a className="top-nav__link" href="#home">Home</a>
                        <button
                            type="button"
                            className={`top-nav__link${props.activeAuthMode === "login" ? " is-active" : ""}`}
                            aria-pressed={props.activeAuthMode === "login"}
                            onClick={() => props.onSelectAuthMode("login")}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            className={`top-nav__link${props.activeAuthMode === "register" ? " is-active" : ""}`}
                            aria-pressed={props.activeAuthMode === "register"}
                            onClick={() => props.onSelectAuthMode("register")}
                        >
                            Create account
                        </button>
                    </div>
                ) : (
                    <div className="top-nav__menu">
                        <a className="top-nav__link is-active" href="#todos" aria-current="page">
                            My todos
                        </a>
                        <span className="top-nav__user">
                            {props.user.name} <span className="top-nav__role">({props.user.role})</span>
                        </span>
                        <button type="button" className="top-nav__button" onClick={props.onLogout}>
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
