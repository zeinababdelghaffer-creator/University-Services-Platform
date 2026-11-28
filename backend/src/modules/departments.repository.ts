import { query } from '../config/db';
import { updateById, UpdateColumn } from './shared/CRUDS';
import {
  Department,
  DepartmentCourse,
  DepartmentDetails,
  DepartmentDoctor,
  UpdateDepartmentInput,
} from '../types/departments.types';

export async function findAll(code?: string): Promise<Department[]> {
  const result = code
    ? await query<Department>('SELECT id, name, code FROM departments WHERE code = $1 ORDER BY id', [
        code,
      ])
    : await query<Department>('SELECT id, name, code FROM departments ORDER BY id');
  return result.rows;
}

export async function findById(id: number): Promise<Department | null> {
  const result = await query<Department>(
    'SELECT id, name, code FROM departments WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findDetails(id: number): Promise<DepartmentDetails | null> {
  const department = await findById(id);
  if (!department) {
    return null;
  }

  const [doctors, courses] = await Promise.all([
    query<DepartmentDoctor>(
      'SELECT id, full_name, email, department_id FROM doctors WHERE department_id = $1 ORDER BY id',
      [id],
    ),
    query<DepartmentCourse>(
      'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE department_id = $1 ORDER BY id',
      [id],
    ),
  ]);

  return { ...department, doctors: doctors.rows, courses: courses.rows };
}

export async function create(input: { name: string; code: string }): Promise<Department> {
  const result = await query<Department>(
    'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING id, name, code',
    [input.name, input.code],
  );
  return result.rows[0];
}

export async function update(
  id: number,
  input: UpdateDepartmentInput,
): Promise<Department | null> {
  const updates: UpdateColumn<'departments'>[] = [];
  if (input.name !== undefined) updates.push({ column: 'name', value: input.name });
  if (input.code !== undefined) updates.push({ column: 'code', value: input.code });
  return updateById<'departments', Department>('departments', id, updates);
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ id: number }>(
    'DELETE FROM departments WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount !== null && result.rowCount > 0;
}
