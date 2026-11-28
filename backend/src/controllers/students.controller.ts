import { asyncHandler } from '../modules/shared/http';
import { parsePathId, queryPositiveInt } from '../modules/shared/validation';
import * as service from '../services/students.service';

export const listStudents = asyncHandler(async (request, response) => {
  const departmentId = queryPositiveInt(request.query.departmentId, 'departmentId');
  const level = queryPositiveInt(request.query.level, 'level');
  const search = service.parseSearch(request.query.search);
  response.json(await service.list({ departmentId, level, search }));
});

export const getStudent = asyncHandler(async (request, response) => {
  response.json(await service.get(parsePathId(request.params.id, 'id')));
});

export const createStudent = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const updateStudent = asyncHandler(async (request, response) => {
  const student = await service.update(
    parsePathId(request.params.id, 'id'),
    request.body as unknown,
  );
  response.json(student);
});

export const deleteStudent = asyncHandler(async (request, response) => {
  await service.remove(parsePathId(request.params.id, 'id'));
  response.status(204).send();
});
