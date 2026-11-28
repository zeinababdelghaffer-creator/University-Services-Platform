import { asyncHandler } from '../modules/shared/http';
import { parsePathId, queryPositiveInt } from '../modules/shared/validation';
import * as service from '../services/teaching-assistants.service';

export const listTeachingAssistants = asyncHandler(async (request, response) => {
  const courseId = queryPositiveInt(request.query.courseId, 'courseId');
  response.json(await service.list({ courseId }));
});

export const getTeachingAssistant = asyncHandler(async (request, response) => {
  response.json(await service.get(parsePathId(request.params.id, 'id')));
});

export const createTeachingAssistant = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const updateTeachingAssistant = asyncHandler(async (request, response) => {
  const assistant = await service.update(
    parsePathId(request.params.id, 'id'),
    request.body as unknown,
  );
  response.json(assistant);
});

export const deleteTeachingAssistant = asyncHandler(async (request, response) => {
  await service.remove(parsePathId(request.params.id, 'id'));
  response.status(204).send();
});
