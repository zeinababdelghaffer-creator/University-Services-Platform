import { AppError } from '../modules/shared/errors';
import { bodyRecord, onlyKeys, optionalText, requiredText } from '../modules/shared/validation';
import * as repository from '../modules/departments.repository';
import { DepartmentQuery, UpdateDepartmentInput } from '../types/departments.types';

export async function list(query: DepartmentQuery) {
  return repository.findAll(query.code);
}

export async function get(id: number) {
  const department = await repository.findDetails(id);
  if (!department) {
    throw new AppError(404, 'Department not found.');
  }
  return department;
}

export async function create(input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['name', 'code']);
  return repository.create({
    name: requiredText(body, 'name', 100),
    code: requiredText(body, 'code', 20),
  });
}

export async function update(id: number, input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['name', 'code']);
  const updates: UpdateDepartmentInput = {
    name: optionalText(body, 'name', 100),
    code: optionalText(body, 'code', 20),
  };
  if (updates.name === undefined && updates.code === undefined) {
    throw new AppError(400, 'At least one field must be provided.');
  }

  const department = await repository.update(id, updates);
  if (!department) {
    throw new AppError(404, 'Department not found.');
  }
  return department;
}

export async function remove(id: number): Promise<void> {
  if (!(await repository.remove(id))) {
    throw new AppError(404, 'Department not found.');
  }
}
