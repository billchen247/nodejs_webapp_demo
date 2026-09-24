import type { RequestHandler } from "express";
import { readStudents, writeStudents, type Student } from "../models/students.js";
import {
    type CreateStudentInput,
    type UpdateStudentInput,
} from "../schemas/students.js";
import { notFound } from "../utils/http-error.js";

export const listStudents: RequestHandler = async (req, res) => {
    const students = await readStudents();
    const registrationActive = (req.query as { registrationActive?: "true" | "false" })
        .registrationActive;

    if (registrationActive === "true") {
        res.json(students.filter((student) => student.registrationActive));
        return;
    }
    if (registrationActive === "false") {
        res.json(students.filter((student) => !student.registrationActive));
        return;
    }
    res.json(students);
};

export const getStudentById: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const students = await readStudents();
    const student = students.find((item) => item.id === id);
    if (!student) throw notFound("Student not found");
    res.json(student);
};

export const createStudent: RequestHandler = async (req, res) => {
    const body = req.body as CreateStudentInput;
    const students = await readStudents();
    const nextId =
        students.length === 0 ? 1 : Math.max(...students.map((student) => student.id)) + 1;

    const student: Student = {
        id: nextId,
        name: body.name,
        registrationActive: false,
        createdAt: new Date().toISOString(),
    };

    students.push(student);
    await writeStudents(students);
    res.status(201).json(student);
};

export const updateStudent: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const body = req.body as UpdateStudentInput;
    const students = await readStudents();
    const index = students.findIndex((student) => student.id === id);
    if (index === -1) throw notFound("Student not found");

    const existing = students[index] as Student;
    if (body.name !== undefined) existing.name = body.name;
    if (body.registrationActive !== undefined) {
        existing.registrationActive = body.registrationActive;
    }

    await writeStudents(students);
    res.json(existing);
};

export const deleteStudent: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const students = await readStudents();
    const index = students.findIndex((student) => student.id === id);
    if (index === -1) throw notFound("Student not found");

    students.splice(index, 1);
    await writeStudents(students);
    res.status(204).end();
};