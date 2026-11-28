import { query } from '../config/db';
import { updateById, UpdateColumn } from './shared/CRUDS';
import {
  StudentCourse,
  StudentDepartment,
  StudentDetails,
  StudentRow,
  UpdateStudentInput,
} from '../types/students.types';

function normalizeStudentRow(row: StudentRow): StudentRow {
  return {
    ...row,
    gpa: row.gpa === null ? null : Number(row.gpa),
    total_gpa: row.total_gpa === null ? null : Number(row.total_gpa),
  };
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function findAll(filters: {
  departmentId?: number;
  level?: number;
  search?: string;
}): Promise<StudentRow[]> {
  const conditions: string[] = [];
  const values: (number | string)[] = [];

  if (filters.departmentId !== undefined) {
    values.push(filters.departmentId);
    conditions.push(`department_id = $${values.length}`);
  }
  if (filters.level !== undefined) {
    values.push(filters.level);
    conditions.push(`level = $${values.length}`);
  }

  const trimmedSearch = filters.search?.trim();
  if (trimmedSearch) {
    const escapedSearch = escapeLikePattern(trimmedSearch);
    values.push(`%${escapedSearch}%`);
    conditions.push(
      `(student_code ILIKE $${values.length} ESCAPE '\\' OR full_name ILIKE $${values.length} ESCAPE '\\' OR email ILIKE $${values.length} ESCAPE '\\')`,
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<StudentRow>(
    `SELECT id, full_name, student_code, email, level, gpa, total_gpa, department_id FROM students ${where} ORDER BY id`,
    values,
  );
  return result.rows.map(normalizeStudentRow);
}

export async function findById(id: number): Promise<StudentRow | null> {
  const result = await query<StudentRow>(
    'SELECT id, full_name, student_code, email, level, gpa, total_gpa, department_id FROM students WHERE id = $1',
    [id],
  );
  return result.rows[0] ? normalizeStudentRow(result.rows[0]) : null;
}

export async function findDetails(id: number): Promise<StudentDetails | null> {
  const studentResult = await query<StudentRow>(
    'SELECT id, full_name, student_code, email, level, gpa, total_gpa, department_id FROM students WHERE id = $1',
    [id],
  );
  const student = studentResult.rows[0] ?? null;
  if (!student) {
    return null;
  }

  const [department, courses] = await Promise.all([
    student.department_id === null
      ? Promise.resolve(null)
      : query<StudentDepartment>('SELECT id, name, code FROM departments WHERE id = $1', [
          student.department_id,
        ]).then((result) => result.rows[0] ?? null),
    query<StudentCourse>(
      `SELECT c.id, c.name, c.code, c.level, c.department_id, c.doctor_id, sc.enrolled_at
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE sc.student_id = $1
       ORDER BY c.id`,
      [id],
    ),
  ]);

  return {
    ...student,
    department,
    courses: courses.rows,
  };
}

export async function create(input: {
  full_name: string;
  student_code: string;
  email: string;
  level: number;
  gpa: number | string | null;
  total_gpa: number | string | null;
  department_id: number;
}): Promise<StudentRow> {
  const result = await query<StudentRow>(
    `INSERT INTO students (full_name, student_code, email, level, gpa, total_gpa, department_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, full_name, student_code, email, level, gpa, total_gpa, department_id`,
    [
      input.full_name,
      input.student_code,
      input.email,
      input.level,
      input.gpa,
      input.total_gpa,
      input.department_id,
    ],
  );
  return normalizeStudentRow(result.rows[0]);
}

export async function update(id: number, input: UpdateStudentInput): Promise<StudentRow | null> {
  const updates: UpdateColumn<'students'>[] = [];
  if (input.level !== undefined) updates.push({ column: 'level', value: input.level });
  if (input.gpa !== undefined) updates.push({ column: 'gpa', value: input.gpa });
  if (input.total_gpa !== undefined) {
    updates.push({ column: 'total_gpa', value: input.total_gpa });
  }
  if (input.department_id !== undefined) {
    updates.push({ column: 'department_id', value: input.department_id });
  }
  const updated = await updateById<'students', StudentRow>('students', id, updates);
  return updated ? normalizeStudentRow(updated) : null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ id: number }>('DELETE FROM students WHERE id = $1 RETURNING id', [
    id,
  ]);
  return result.rowCount !== null && result.rowCount > 0;
}