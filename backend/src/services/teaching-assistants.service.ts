import { AppError } from '../modules/shared/errors';
import { existsById } from '../modules/shared/CRUDS';
import {
  bodyRecord,
  onlyKeys,
  optionalNullableId,
  optionalText,
  requiredId,
  requiredText,
} from '../modules/shared/validation';
import * as repository from '../modules/teaching-assistants.repository';
import {
  TeachingAssistantQuery,
  UpdateTeachingAssistantInput,
} from '../types/teaching-assistants.types';

export async function list(query: TeachingAssistantQuery) {
  return repository.findAll(query.courseId);
}

export async function get(id: number) {
  const assistant = await repository.findDetails(id);
  if (!assistant) {
    throw new AppError(404, 'Teaching assistant not found.');
  }
  return assistant;
}

export async function create(input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['full_name', 'email', 'course_id']);
  const courseId = requiredId(body, 'course_id');
  if (!(await existsById('courses', courseId))) {
    throw new AppError(400, 'course_id does not reference an existing course.');
  }

  return repository.create({
    full_name: requiredText(body, 'full_name', 120),
    email: requiredText(body, 'email', 120),
    course_id: courseId,
  });
}

export async function update(id: number, input: unknown) {
  const body = bodyRecord(input);
  onlyKeys(body, ['full_name', 'email', 'course_id']);
  const courseId = optionalNullableId(body, 'course_id');
  if (courseId !== undefined && courseId !== null &&
      !(await existsById('courses', courseId))) {
    throw new AppError(400, 'course_id does not reference an existing course.');
  }
  const updates: UpdateTeachingAssistantInput = {
    full_name: optionalText(body, 'full_name', 120),
    email: optionalText(body, 'email', 120),
    course_id: courseId,
  };
  if (Object.values(updates).every((value) => value === undefined)) {
    throw new AppError(400, 'At least one field must be provided.');
  }

  const assistant = await repository.update(id, updates);
  if (!assistant) {
    throw new AppError(404, 'Teaching assistant not found.');
  }
  return assistant;
}

export async function remove(id: number): Promise<void> {
  if (!(await repository.remove(id))) {
    throw new AppError(404, 'Teaching assistant not found.');
  }
}
