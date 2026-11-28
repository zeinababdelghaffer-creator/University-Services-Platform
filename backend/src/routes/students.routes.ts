import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from '../controllers/students.controller';

const studentsRouter = Router();

studentsRouter.get('/', listStudents);
studentsRouter.get('/:id', getStudent);
studentsRouter.post('/', createStudent);
studentsRouter.patch('/:id', updateStudent);
studentsRouter.delete('/:id', deleteStudent);

export default studentsRouter;
