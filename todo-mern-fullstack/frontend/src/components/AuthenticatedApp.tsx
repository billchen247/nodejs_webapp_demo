import { useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { TodoForm } from "./TodoForm";
import { TodoList } from "./TodoList";
import { NavigationBar, type AuthenticatedPage } from "./NavigationBar";
import { LocalStorageDemo } from "./LocalStorageDemo";
import { SessionStorageDemo } from "./SessionStorageDemo";
import { useTodos } from "../hooks/useTodos";
import { useProjects } from "../hooks/useProjects";
import { ProjectForm } from "./ProjectForm";
import { ProjectList } from "./ProjectList";
import type { User } from "../types/auth";

interface Props {
    user: User;
    onLogout: () => void;
}

function getPageFromHash(): AuthenticatedPage {
    if (window.location.hash === "#projects") return "projects";
    if (window.location.hash === "#todos") return "todos";
    return "home";
}

export function AuthenticatedApp({ user, onLogout }: Props) {
    const [authActionError, setAuthActionError] = useState<string | null>(null);
    const [page, setPage] = useState<AuthenticatedPage>(getPageFromHash);
    const {
        todos,
        loading,
        error,
        createTodo,
        toggleTodo,
        renameTodo,
        removeTodo,
    } = useTodos();
    const {
        projects,
        loading: projectsLoading,
        error: projectsError,
        addProject,
        updateProject,
        removeProject,
    } = useProjects();

    const remainingCount = useMemo(
        () => todos.filter((todo) => !todo.completed).length,
        [todos],
    );

    useEffect(() => {
        function updatePageFromHash(): void {
            setPage(getPageFromHash());
        }

        window.addEventListener("hashchange", updatePageFromHash);
        return () => window.removeEventListener("hashchange", updatePageFromHash);
    }, []);

    async function logout(): Promise<void> {
        try {
            await authApi.logout();
            setAuthActionError(null);
            onLogout();
        } catch (err) {
            setAuthActionError(err instanceof Error ? err.message : "Unable to sign out.");
        }
    }

    const showProjects = page !== "todos";
    const showTodos = page !== "projects";
    const isDashboard = page === "home";
    const heading = isDashboard
        ? "Dashboard"
        : page === "projects"
            ? "My projects"
            : "My todos";

    return (
        <>
            <NavigationBar
                mode="authenticated"
                user={user}
                activePage={page}
                onLogout={() => void logout()}
            />
            <main
                className={`app${page === "projects" ? " projects" : ""}`}
                id={page}
                aria-labelledby={`${page}-heading`}
            >
                <header className="app__header">
                    <h1 id={`${page}-heading`}>{heading}</h1>
                    <p className="app__subtitle">
                        {isDashboard
                            ? "Your projects, todos, and browser storage demos in one place."
                            : page === "projects"
                                ? "Create, edit, and organize your projects."
                                : "React 19 · Vite · TypeScript · Express 5 · MongoDB"}
                    </p>
                </header>

                {authActionError && (
                    <div role="alert" className="app__error">{authActionError}</div>
                )}

                {showProjects && (
                    <section className={isDashboard ? "dashboard-section" : undefined} aria-label="Projects">
                        {isDashboard && <h2>Projects</h2>}
                        <ProjectForm onCreated={addProject} />

                        {projectsError && (
                            <div role="alert" className="app__error">{projectsError}</div>
                        )}

                        <ProjectList
                            projects={projects}
                            loading={projectsLoading}
                            onUpdate={updateProject}
                            onRemove={removeProject}
                        />
                    </section>
                )}

                {showTodos && (
                    <section className={isDashboard ? "dashboard-section" : undefined} aria-label="Todos">
                        {isDashboard && <h2>Todos</h2>}
                        <TodoForm onCreate={createTodo} />

                        {error && (
                            <div role="alert" className="app__error">{error}</div>
                        )}

                        <TodoList
                            todos={todos}
                            loading={loading}
                            onToggle={toggleTodo}
                            onRename={renameTodo}
                            onRemove={removeTodo}
                        />

                        <footer className="app__footer">
                            <span>{remainingCount} of {todos.length} remaining</span>
                            <span className="app__hint">Double-click a todo to rename it.</span>
                        </footer>
                    </section>
                )}

                {isDashboard && (
                    <>
                        <LocalStorageDemo userId={user.id} />
                        <SessionStorageDemo userId={user.id} />

                        <aside className="storage-comparison" aria-labelledby="storage-comparison-heading">
                            <h2 id="storage-comparison-heading">LocalStorage vs SessionStorage</h2>
                            <p>
                                Both store data in this browser for this site and survive a page refresh.
                                LocalStorage remains after closing and reopening the browser until it is
                                cleared; SessionStorage belongs to the current tab and is cleared when
                                that tab’s browsing session ends. Neither automatically sends data to
                                the server.
                            </p>
                        </aside>
                    </>
                )}
            </main>
        </>
    );
}
