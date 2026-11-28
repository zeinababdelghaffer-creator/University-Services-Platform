import { existsById } from '../modules/shared/CRUDS';
import { AppError } from '../modules/shared/errors';
import { bodyRecord, onlyKeys, requiredId } from '../modules/shared/validation';
import * as repository from '../modules/enrollments.repository';

export async function getStudentCourses(studentId: number) {
  if (!(await existsById('students', studentId))) {
    throw new AppError(404, 'Student not found.');
  }
  return repository.findStudentCourses(studentId);
}

export async function getCourseStudents(courseId: number) {
  if (!(await existsById('courses', courseId))) {
    throw new AppError(404, 'Course not found.');
  }
  return repository.findCourseStudents(courseId);
}

export async function create(input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['student_id', 'course_id']);
  const studentId = requiredId(body, 'student_id');
  const courseId = requiredId(body, 'course_id');
  const [studentExists, courseExists] = await Promise.all([
    existsById('students', studentId),
    existsById('courses', courseId),
  ]);
  if (!studentExists) {
    throw new AppError(400, 'student_id does not reference an existing student.');
  }
  if (!courseExists) {
    throw new AppError(400, 'course_id does not reference an existing course.');
  }
  return repository.create({ student_id: studentId, course_id: courseId });
}

export async function remove(studentId: number, courseId: number): Promise<void> {
  if (!(await repository.remove(studentId, courseId))) {
    throw new AppError(404, 'Enrollment not found.');
  }
}
