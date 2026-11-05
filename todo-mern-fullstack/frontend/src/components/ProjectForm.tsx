import { useState, type FormEvent } from "react";

interface Props {
    onCreate: (name: string, description: string) => Promise<boolean>;
}

export function ProjectForm({ onCreate }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setSubmitting(true);
        try {
            if (await onCreate(trimmedName, description.trim())) {
                setName("");
                setDescription("");
            }
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
        </form>
    );
}
