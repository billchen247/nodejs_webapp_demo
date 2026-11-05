import type { AuthMode } from "./AuthForm";
import type { User } from "../types/auth";

export type AuthenticatedPage = "home" | "projects" | "todos";

type Props =
    | {
        mode: "guest";
        activeAuthMode: AuthMode;
        onSelectAuthMode: (mode: AuthMode) => void;
    }
    | {
        mode: "authenticated";
        user: User;
        activePage: AuthenticatedPage;
        onLogout: () => void;
    };

export function NavigationBar(props: Props) {
    return (
        <nav className="top-nav" aria-label="Main navigation">
            <div className="top-nav__inner">
                <a className="top-nav__brand" href="#home">
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
                        <a
                            className={`top-nav__link${props.activePage === "home" ? " is-active" : ""}`}
                            href="#home"
                            aria-current={props.activePage === "home" ? "page" : undefined}
                        >
                            Dashboard
                        </a>
                        <a
                            className={`top-nav__link${props.activePage === "projects" ? " is-active" : ""}`}
                            href="#projects"
                            aria-current={props.activePage === "projects" ? "page" : undefined}
                        >
                            My projects
                        </a>
                        <a
                            className={`top-nav__link${props.activePage === "todos" ? " is-active" : ""}`}
                            href="#todos"
                            aria-current={props.activePage === "todos" ? "page" : undefined}
                        >
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
