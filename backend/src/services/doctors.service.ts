import { existsById } from '../modules/shared/CRUDS';
import { AppError } from '../modules/shared/errors';
import {
  bodyRecord,
  onlyKeys,
  optionalNullableId,
  optionalText,
  requiredText,
} from '../modules/shared/validation';
import * as repository from '../modules/doctors.repository';
import { DoctorQuery, UpdateDoctorInput } from '../types/doctors.types';

export async function list(query: DoctorQuery) {
  return repository.findAll(query.departmentId);
}

export async function get(id: number) {
  const doctor = await repository.findDetails(id);
  if (!doctor) {
    throw new AppError(404, 'Doctor not found.');
  }
  return doctor;
}

export async function create(input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['full_name', 'email', 'department_id']);
  const departmentId = optionalNullableId(body, 'department_id') ?? null;
  if (departmentId !== null && !(await existsById('departments', departmentId))) {
    throw new AppError(400, 'department_id does not reference an existing department.');
  }

  return repository.create({
    full_name: requiredText(body, 'full_name', 120),
    email: requiredText(body, 'email', 120),
    department_id: departmentId,
  });
}

export async function update(id: number, input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['full_name', 'email', 'department_id']);
  const departmentId = optionalNullableId(body, 'department_id');
  if (departmentId !== undefined && departmentId !== null &&
      !(await existsById('departments', departmentId))) {
    throw new AppError(400, 'department_id does not reference an existing department.');
  }
  const updates: UpdateDoctorInput = {
    full_name: optionalText(body, 'full_name', 120),
    email: optionalText(body, 'email', 120),
    department_id: departmentId,
  };
  if (Object.values(updates).every((value) => value === undefined)) {
    throw new AppError(400, 'At least one field must be provided.');
  }

  const doctor = await repository.update(id, updates);
  if (!doctor) {
    throw new AppError(404, 'Doctor not found.');
  }
  return doctor;
}

export async function remove(id: number): Promise<void> {
  if (!(await repository.remove(id))) {
    throw new AppError(404, 'Doctor not found.');
  }
}
