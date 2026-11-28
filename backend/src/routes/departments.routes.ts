import { Router } from 'express';
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from '../controllers/departments.controller';

const departmentsRouter = Router();

departmentsRouter.get('/', listDepartments);
departmentsRouter.get('/:id', getDepartment);
departmentsRouter.post('/', createDepartment);
departmentsRouter.patch('/:id', updateDepartment);
departmentsRouter.delete('/:id', deleteDepartment);

export default departmentsRouter;
