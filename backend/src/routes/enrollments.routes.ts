import { Router } from 'express';
import {
  createEnrollment,
  deleteEnrollment,
  getCourseStudents,
  getStudentCourses,
} from '../controllers/enrollments.controller';

export const enrollmentsRouter = Router();
export const studentCoursesRouter = Router();
export const courseStudentsRouter = Router();

enrollmentsRouter.post('/', createEnrollment);
enrollmentsRouter.delete('/:studentId/:courseId', deleteEnrollment);
studentCoursesRouter.get('/:studentId/courses', getStudentCourses);
courseStudentsRouter.get('/:courseId/students', getCourseStudents);
