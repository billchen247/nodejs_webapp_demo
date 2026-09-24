import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_FILE: string = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "students.json"
);

export interface Student {
    id: number;
    name: string;
    registrationActive: boolean;
    createdAt: string;
}

export async function readStudents(): Promise<Student[]> {
    try {
        const raw = await readFile(DATA_FILE, "utf8");
        if (raw.trim() === "") return [];
        return JSON.parse(raw) as Student[];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
    }
}

export async function writeStudents(students: Student[]): Promise<void> {
    await writeFile(DATA_FILE, JSON.stringify(students, null, 2), "utf8");
}