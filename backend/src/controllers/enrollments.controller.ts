import { asyncHandler } from '../modules/shared/http';
import { parsePathId } from '../modules/shared/validation';
import * as service from '../services/enrollments.service';

export const createEnrollment = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const deleteEnrollment = asyncHandler(async (request, response) => {
  const studentId = parsePathId(request.params.studentId, 'studentId');
  const courseId = parsePathId(request.params.courseId, 'courseId');
  await service.remove(studentId, courseId);
  response.status(204).send();
});

export const getStudentCourses = asyncHandler(async (request, response) => {
  const studentId = parsePathId(request.params.studentId, 'studentId');
  response.json(await service.getStudentCourses(studentId));
});

export const getCourseStudents = asyncHandler(async (request, response) => {
  const courseId = parsePathId(request.params.courseId, 'courseId');
  response.json(await service.getCourseStudents(courseId));
});
