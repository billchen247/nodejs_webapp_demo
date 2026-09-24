import { Router } from "express";
import * as students from "../controllers/students.js";
import { validate } from "../middleware/validate.js";
import {
    CreateStudentSchema,
    StudentIdParamSchema,
    StudentListQuerySchema,
    UpdateStudentSchema,
} from "../schemas/students.js";

export const studentsRouter = Router();

studentsRouter
    .route("/")
    .get(validate({ query: StudentListQuerySchema }), students.listStudents)
    .post(validate({ body: CreateStudentSchema }), students.createStudent);

studentsRouter
    .route("/:id")
    .get(validate({ params: StudentIdParamSchema }), students.getStudentById)
    .put(
        validate({ params: StudentIdParamSchema, body: UpdateStudentSchema }),
        students.updateStudent
    )
    .delete(validate({ params: StudentIdParamSchema }), students.deleteStudent);