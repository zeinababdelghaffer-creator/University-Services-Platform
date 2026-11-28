import { existsById } from '../modules/shared/CRUDS';
import { AppError } from '../modules/shared/errors';
import {
  bodyRecord,
  onlyKeys,
  optionalLevel,
  optionalNullableGpa,
  optionalNullableId,
  queryString,
  requiredId,
  requiredLevel,
  requiredText,
} from '../modules/shared/validation';
import * as repository from '../modules/students.repository';
import { Student, StudentQuery, StudentRow, UpdateStudentInput } from '../types/students.types';

function mapStudent(row: StudentRow): Student {
  return {
    ...row,
    gpa: row.gpa === null ? null : Number(row.gpa),
    total_gpa: row.total_gpa === null ? null : Number(row.total_gpa),
  };
}

export async function list(query: StudentQuery): Promise<Student[]> {
  const students = await repository.findAll(query);
  return students.map(mapStudent);
}

export async function get(id: number) {
  const student = await repository.findDetails(id);
  if (!student) {
    throw new AppError(404, 'Student not found.');
  }
  return {
    ...student,
    gpa: student.gpa === null ? null : Number(student.gpa),
    total_gpa: student.total_gpa === null ? null : Number(student.total_gpa),
  };
}

export async function create(input: unknown): Promise<Student> {
  const body = bodyRecord(input);
  onlyKeys(body, [
    'full_name',
    'student_code',
    'email',
    'level',
    'gpa',
    'total_gpa',
    'department_id',
  ]);
  const departmentId = requiredId(body, 'department_id');
  if (!(await existsById('departments', departmentId))) {
    throw new AppError(400, 'department_id does not reference an existing department.');
  }
  const gpa = optionalNullableGpa(body, 'gpa');
  const totalGpa = optionalNullableGpa(body, 'total_gpa');
  const student = await repository.create({
    full_name: requiredText(body, 'full_name', 120),
    student_code: requiredText(body, 'student_code', 30),
    email: requiredText(body, 'email', 120),
    level: requiredLevel(body, 'level'),
    gpa: gpa ?? null,
    total_gpa: totalGpa ?? null,
    department_id: departmentId,
  });
  return mapStudent(student);
}

export async function update(id: number, input: unknown): Promise<Student> {
  const body = bodyRecord(input);
  onlyKeys(body, ['level', 'gpa', 'total_gpa', 'department_id']);
  const departmentId = optionalNullableId(body, 'department_id');
  if (departmentId !== undefined && departmentId !== null &&
      !(await existsById('departments', departmentId))) {
    throw new AppError(400, 'department_id does not reference an existing department.');
  }
  const updates: UpdateStudentInput = {
    level: optionalLevel(body, 'level'),
    gpa: optionalNullableGpa(body, 'gpa'),
    total_gpa: optionalNullableGpa(body, 'total_gpa'),
    department_id: departmentId,
  };
  if (Object.values(updates).every((value) => value === undefined)) {
    throw new AppError(400, 'At least one field must be provided.');
  }

  const student = await repository.update(id, updates);
  if (!student) {
    throw new AppError(404, 'Student not found.');
  }
  return mapStudent(student);
}

export async function remove(id: number): Promise<void> {
  if (!(await repository.remove(id))) {
    throw new AppError(404, 'Student not found.');
  }
}

export function parseSearch(value: unknown): string | undefined {
  return queryString(value, 'search');
}
