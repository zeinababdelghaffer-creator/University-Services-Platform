import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from '../controllers/courses.controller';

const coursesRouter = Router();

coursesRouter.get('/', listCourses);
coursesRouter.get('/:id', getCourse);
coursesRouter.post('/', createCourse);
coursesRouter.patch('/:id', updateCourse);
coursesRouter.delete('/:id', deleteCourse);

export default coursesRouter;
