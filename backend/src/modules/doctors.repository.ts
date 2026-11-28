import { query } from '../config/db';
import { updateById, UpdateColumn } from './shared/CRUDS';
import {
  Doctor,
  DoctorCourse,
  DoctorDepartment,
  DoctorDetails,
  UpdateDoctorInput,
} from '../types/doctors.types';

export async function findAll(departmentId?: number): Promise<Doctor[]> {
  const result = departmentId === undefined
    ? await query<Doctor>(
        'SELECT id, full_name, email, department_id FROM doctors ORDER BY id',
      )
    : await query<Doctor>(
        'SELECT id, full_name, email, department_id FROM doctors WHERE department_id = $1 ORDER BY id',
        [departmentId],
      );
  return result.rows;
}

export async function findById(id: number): Promise<Doctor | null> {
  const result = await query<Doctor>(
    'SELECT id, full_name, email, department_id FROM doctors WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findDetails(id: number): Promise<DoctorDetails | null> {
  const doctor = await findById(id);
  if (!doctor) {
    return null;
  }

  const [department, courses] = await Promise.all([
    doctor.department_id === null
      ? Promise.resolve(null)
      : query<DoctorDepartment>('SELECT id, name, code FROM departments WHERE id = $1', [
          doctor.department_id,
        ]).then((result) => result.rows[0] ?? null),
    query<DoctorCourse>(
      'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE doctor_id = $1 ORDER BY id',
      [id],
    ),
  ]);

  return { ...doctor, department, courses: courses.rows };
}

export async function create(input: {
  full_name: string;
  email: string;
  department_id: number | null;
}): Promise<Doctor> {
  const result = await query<Doctor>(
    'INSERT INTO doctors (full_name, email, department_id) VALUES ($1, $2, $3) RETURNING id, full_name, email, department_id',
    [input.full_name, input.email, input.department_id],
  );
  return result.rows[0];
}

export async function update(id: number, input: UpdateDoctorInput): Promise<Doctor | null> {
  const updates: UpdateColumn<'doctors'>[] = [];
  if (input.full_name !== undefined) updates.push({ column: 'full_name', value: input.full_name });
  if (input.email !== undefined) updates.push({ column: 'email', value: input.email });
  if (input.department_id !== undefined) {
    updates.push({ column: 'department_id', value: input.department_id });
  }
  return updateById<'doctors', Doctor>('doctors', id, updates);
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ id: number }>('DELETE FROM doctors WHERE id = $1 RETURNING id', [
    id,
  ]);
  return result.rowCount !== null && result.rowCount > 0;
}
