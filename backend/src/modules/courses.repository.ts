import { query } from '../config/db';
import { updateById, UpdateColumn } from './shared/CRUDS';
import {
  Course,
  CourseDetails,
  CourseDoctor,
  CourseTeachingAssistant,
  UpdateCourseInput,
} from '../types/courses.types';

export async function findAll(filters: {
  departmentId?: number;
  level?: number;
  doctorId?: number;
}): Promise<Course[]> {
  const conditions: string[] = [];
  const values: number[] = [];

  if (filters.departmentId !== undefined) {
    values.push(filters.departmentId);
    conditions.push(`department_id = $${values.length}`);
  }
  if (filters.level !== undefined) {
    values.push(filters.level);
    conditions.push(`level = $${values.length}`);
  }
  if (filters.doctorId !== undefined) {
    values.push(filters.doctorId);
    conditions.push(`doctor_id = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<Course>(
    `SELECT id, name, code, level, department_id, doctor_id FROM courses ${where} ORDER BY id`,
    values,
  );
  return result.rows;
}

export async function findById(id: number): Promise<Course | null> {
  const result = await query<Course>(
    'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findDetails(id: number): Promise<CourseDetails | null> {
  const course = await findById(id);
  if (!course) {
    return null;
  }

  const [doctor, teachingAssistants, enrollmentCount] = await Promise.all([
    course.doctor_id === null
      ? Promise.resolve(null)
      : query<CourseDoctor>(
          'SELECT id, full_name, email, department_id FROM doctors WHERE id = $1',
          [course.doctor_id],
        ).then((result) => result.rows[0] ?? null),
    query<CourseTeachingAssistant>(
      'SELECT id, full_name, email, course_id FROM teaching_assistants WHERE course_id = $1 ORDER BY id',
      [id],
    ),
    query<{ enrolled_count: string }>(
      'SELECT COUNT(*)::text AS enrolled_count FROM student_courses WHERE course_id = $1',
      [id],
    ),
  ]);

  return {
    ...course,
    doctor,
    teaching_assistants: teachingAssistants.rows,
    enrolled_count: Number(enrollmentCount.rows[0].enrolled_count),
  };
}

export async function create(input: {
  name: string;
  code: string;
  level: number;
  department_id: number;
  doctor_id: number | null;
}): Promise<Course> {
  const result = await query<Course>(
    'INSERT INTO courses (name, code, level, department_id, doctor_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, code, level, department_id, doctor_id',
    [input.name, input.code, input.level, input.department_id, input.doctor_id],
  );
  return result.rows[0];
}

export async function update(id: number, input: UpdateCourseInput): Promise<Course | null> {
  const updates: UpdateColumn<'courses'>[] = [];
  if (input.name !== undefined) updates.push({ column: 'name', value: input.name });
  if (input.code !== undefined) updates.push({ column: 'code', value: input.code });
  if (input.level !== undefined) updates.push({ column: 'level', value: input.level });
  if (input.doctor_id !== undefined) {
    updates.push({ column: 'doctor_id', value: input.doctor_id });
  }
  return updateById<'courses', Course>('courses', id, updates);
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ id: number }>('DELETE FROM courses WHERE id = $1 RETURNING id', [
    id,
  ]);
  return result.rowCount !== null && result.rowCount > 0;
}
