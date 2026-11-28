import { asyncHandler } from '../modules/shared/http';
import { parsePathId, queryString } from '../modules/shared/validation';
import * as service from '../services/departments.service';

export const listDepartments = asyncHandler(async (request, response) => {
  const code = queryString(request.query.code, 'code');
  response.json(await service.list({ code }));
});

export const getDepartment = asyncHandler(async (request, response) => {
  response.json(await service.get(parsePathId(request.params.id, 'id')));
});

export const createDepartment = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const updateDepartment = asyncHandler(async (request, response) => {
  const department = await service.update(
    parsePathId(request.params.id, 'id'),
    request.body as unknown,
  );
  response.json(department);
});

export const deleteDepartment = asyncHandler(async (request, response) => {
  await service.remove(parsePathId(request.params.id, 'id'));
  response.status(204).send();
});
