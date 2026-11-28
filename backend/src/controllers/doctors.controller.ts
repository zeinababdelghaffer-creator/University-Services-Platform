import { asyncHandler } from '../modules/shared/http';
import { parsePathId, queryPositiveInt } from '../modules/shared/validation';
import * as service from '../services/doctors.service';

export const listDoctors = asyncHandler(async (request, response) => {
  const departmentId = queryPositiveInt(request.query.departmentId, 'departmentId');
  response.json(await service.list({ departmentId }));
});

export const getDoctor = asyncHandler(async (request, response) => {
  response.json(await service.get(parsePathId(request.params.id, 'id')));
});

export const createDoctor = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const updateDoctor = asyncHandler(async (request, response) => {
  const doctor = await service.update(
    parsePathId(request.params.id, 'id'),
    request.body as unknown,
  );
  response.json(doctor);
});

export const deleteDoctor = asyncHandler(async (request, response) => {
  await service.remove(parsePathId(request.params.id, 'id'));
  response.status(204).send();
});
