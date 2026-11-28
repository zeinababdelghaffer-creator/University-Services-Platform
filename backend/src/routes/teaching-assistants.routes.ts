import { Router } from 'express';
import {
  createTeachingAssistant,
  deleteTeachingAssistant,
  getTeachingAssistant,
  listTeachingAssistants,
  updateTeachingAssistant,
} from '../controllers/teaching-assistants.controller';

const teachingAssistantsRouter = Router();

teachingAssistantsRouter.get('/', listTeachingAssistants);
teachingAssistantsRouter.get('/:id', getTeachingAssistant);
teachingAssistantsRouter.post('/', createTeachingAssistant);
teachingAssistantsRouter.patch('/:id', updateTeachingAssistant);
teachingAssistantsRouter.delete('/:id', deleteTeachingAssistant);

export default teachingAssistantsRouter;
