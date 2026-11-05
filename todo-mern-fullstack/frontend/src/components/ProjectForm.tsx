import { useState, type FormEvent } from "react";
import { projectsApi } from "../api/projects";
import type { Project } from "../types/project";

interface Props {
    onCreated: (project: Project) => void;
}

export function ProjectForm({ onCreated }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setSubmitting(true);
        setError(null);
        try {
            const created = await projectsApi.create({
                name: trimmedName,
                description: description.trim(),
            });
            onCreated(created);
            setName("");
            setDescription("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create project.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <label>
                Project name
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={120}
                    required
                    disabled={submitting}
                />
            </label>
            <label>
                Description
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={1000}
                    rows={2}
                    disabled={submitting}
                />
            </label>
            <button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? "Adding…" : "Add project"}
            </button>
            {error && <div role="alert" className="app__error">{error}</div>}
        </form>
    );
}
