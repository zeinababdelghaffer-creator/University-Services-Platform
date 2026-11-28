import { Course } from './courses.types';
import { Student } from './students.types';

export interface Enrollment {
  student_id: number;
  course_id: number;
  enrolled_at: Date | null;
}

export interface EnrolledCourse extends Course {
  enrolled_at: Date | null;
}

export interface EnrolledStudent
  extends Pick<Student, 'id' | 'full_name' | 'student_code' | 'email' | 'level' | 'department_id'> {}

export interface CreateEnrollmentInput {
  student_id: number;
  course_id: number;
}
