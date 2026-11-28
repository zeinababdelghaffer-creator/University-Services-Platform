import { Router } from 'express';
import coursesRouter from './routes/courses.routes';
import departmentsRouter from './routes/departments.routes';
import doctorsRouter from './routes/doctors.routes';
import {
  courseStudentsRouter,
  enrollmentsRouter,
  studentCoursesRouter,
} from './routes/enrollments.routes';
import studentsRouter from './routes/students.routes';
import teachingAssistantsRouter from './routes/teaching-assistants.routes';

const apiRouter = Router();

apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/doctors', doctorsRouter);
apiRouter.use('/courses', coursesRouter, courseStudentsRouter);
apiRouter.use('/teaching-assistants', teachingAssistantsRouter);
apiRouter.use('/students', studentsRouter, studentCoursesRouter);
apiRouter.use('/enrollments', enrollmentsRouter);

export default apiRouter;
