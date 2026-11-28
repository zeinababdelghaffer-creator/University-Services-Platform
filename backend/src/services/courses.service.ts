import { existsById } from '../modules/shared/CRUDS';
import { AppError } from '../modules/shared/errors';
import {
  bodyRecord,
  onlyKeys,
  optionalLevel,
  optionalNullableId,
  optionalText,
  requiredId,
  requiredLevel,
  requiredText,
} from '../modules/shared/validation';
import * as repository from '../modules/courses.repository';
import { CourseQuery, UpdateCourseInput } from '../types/courses.types';

export async function list(query: CourseQuery) {
  return repository.findAll(query);
}

export async function get(id: number) {
  const course = await repository.findDetails(id);
  if (!course) {
    throw new AppError(404, 'Course not found.');
  }
  return course;
}

export async function create(input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['name', 'code', 'level', 'department_id', 'doctor_id']);
  const departmentId = requiredId(body, 'department_id');
  const doctorId = optionalNullableId(body, 'doctor_id') ?? null;
  if (!(await existsById('departments', departmentId))) {
    throw new AppError(400, 'department_id does not reference an existing department.');
  }
  if (doctorId !== null && !(await existsById('doctors', doctorId))) {
    throw new AppError(400, 'doctor_id does not reference an existing doctor.');
  }

  return repository.create({
    name: requiredText(body, 'name', 120),
    code: requiredText(body, 'code', 20),
    level: requiredLevel(body, 'level'),
    department_id: departmentId,
    doctor_id: doctorId,
  });
}

export async function update(id: number, input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['name', 'code', 'level', 'doctor_id']);
  const doctorId = optionalNullableId(body, 'doctor_id');
  if (doctorId !== undefined && doctorId !== null &&
      !(await existsById('doctors', doctorId))) {
    throw new AppError(400, 'doctor_id does not reference an existing doctor.');
  }
  const updates: UpdateCourseInput = {
    name: optionalText(body, 'name', 120),
    code: optionalText(body, 'code', 20),
    level: optionalLevel(body, 'level'),
    doctor_id: doctorId,
  };
  if (Object.values(updates).every((value) => value === undefined)) {
    throw new AppError(400, 'At least one field must be provided.');
  }

  const course = await repository.update(id, updates);
  if (!course) {
    throw new AppError(404, 'Course not found.');
  }
  return course;
}

export async function remove(id: number): Promise<void> {
  if (!(await repository.remove(id))) {
    throw new AppError(404, 'Course not found.');
  }
}
