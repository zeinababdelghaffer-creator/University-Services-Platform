import { Router } from 'express';
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  listDoctors,
  updateDoctor,
} from '../controllers/doctors.controller';

const doctorsRouter = Router();

doctorsRouter.get('/', listDoctors);
doctorsRouter.get('/:id', getDoctor);
doctorsRouter.post('/', createDoctor);
doctorsRouter.patch('/:id', updateDoctor);
doctorsRouter.delete('/:id', deleteDoctor);

export default doctorsRouter;
