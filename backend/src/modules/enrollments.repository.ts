import { query } from '../config/db';
import { Course } from '../types/courses.types';
import { EnrolledCourse, EnrolledStudent, Enrollment } from '../types/enrollments.types';

export async function findStudentCourses(studentId: number): Promise<EnrolledCourse[]> {
  const result = await query<EnrolledCourse>(
    `SELECT c.id, c.name, c.code, c.level, c.department_id, c.doctor_id, sc.enrolled_at
     FROM student_courses sc
     JOIN courses c ON c.id = sc.course_id
     WHERE sc.student_id = $1
     ORDER BY c.id`,
    [studentId],
  );
  return result.rows;
}

export async function findCourseStudents(courseId: number): Promise<EnrolledStudent[]> {
  const result = await query<EnrolledStudent>(
    `SELECT s.id, s.full_name, s.student_code, s.email, s.level, s.department_id
     FROM student_courses sc
     JOIN students s ON s.id = sc.student_id
     WHERE sc.course_id = $1
     ORDER BY s.id`,
    [courseId],
  );
  return result.rows;
}

export async function create(input: {
  student_id: number;
  course_id: number;
}): Promise<Enrollment> {
  const result = await query<Enrollment>(
    `INSERT INTO student_courses (student_id, course_id)
     VALUES ($1, $2)
     RETURNING student_id, course_id, enrolled_at`,
    [input.student_id, input.course_id],
  );
  return result.rows[0];
}

export async function remove(studentId: number, courseId: number): Promise<boolean> {
  const result = await query<{ student_id: number; course_id: number }>(
    `DELETE FROM student_courses
     WHERE student_id = $1 AND course_id = $2
     RETURNING student_id, course_id`,
    [studentId, courseId],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function findCourse(id: number): Promise<Course | null> {
  const result = await query<Course>(
    'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}
