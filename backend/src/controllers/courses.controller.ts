import { asyncHandler } from '../modules/shared/http';
import { parsePathId, queryPositiveInt } from '../modules/shared/validation';
import * as service from '../services/courses.service';

export const listCourses = asyncHandler(async (request, response) => {
  const departmentId = queryPositiveInt(request.query.departmentId, 'departmentId');
  const level = queryPositiveInt(request.query.level, 'level');
  const doctorId = queryPositiveInt(request.query.doctorId, 'doctorId');
  response.json(await service.list({ departmentId, level, doctorId }));
});

export const getCourse = asyncHandler(async (request, response) => {
  response.json(await service.get(parsePathId(request.params.id, 'id')));
});

export const createCourse = asyncHandler(async (request, response) => {
  response.status(201).json(await service.create(request.body as unknown));
});

export const updateCourse = asyncHandler(async (request, response) => {
  const course = await service.update(
    parsePathId(request.params.id, 'id'),
    request.body as unknown,
  );
  response.json(course);
});

export const deleteCourse = asyncHandler(async (request, response) => {
  await service.remove(parsePathId(request.params.id, 'id'));
  response.status(204).send();
});
