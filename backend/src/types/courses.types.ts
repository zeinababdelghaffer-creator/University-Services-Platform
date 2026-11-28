export interface Course {
  id: number;
  name: string;
  code: string;
  level: number;
  department_id: number | null;
  doctor_id: number | null;
}

export interface CourseDoctor {
  id: number;
  full_name: string;
  email: string;
  department_id: number | null;
}

export interface CourseTeachingAssistant {
  id: number;
  full_name: string;
  email: string;
  course_id: number | null;
}

export interface CourseDetails extends Course {
  doctor: CourseDoctor | null;
  teaching_assistants: CourseTeachingAssistant[];
  enrolled_count: number;
}

export interface CreateCourseInput {
  name: string;
  code: string;
  level: number;
  department_id: number;
  doctor_id?: number | null;
}

export interface UpdateCourseInput {
  name?: string;
  code?: string;
  level?: number;
  doctor_id?: number | null;
}

export interface CourseQuery {
  departmentId?: number;
  level?: number;
  doctorId?: number;
}
