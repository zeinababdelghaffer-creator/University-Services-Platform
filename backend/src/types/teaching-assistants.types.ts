export interface TeachingAssistant {
  id: number;
  full_name: string;
  email: string;
  course_id: number | null;
}

export interface TeachingAssistantCourse {
  id: number;
  name: string;
  code: string;
  level: number;
  department_id: number | null;
  doctor_id: number | null;
}

export interface TeachingAssistantDetails extends TeachingAssistant {
  course: TeachingAssistantCourse | null;
}

export interface CreateTeachingAssistantInput {
  full_name: string;
  email: string;
  course_id: number;
}

export interface UpdateTeachingAssistantInput {
  full_name?: string;
  email?: string;
  course_id?: number | null;
}

export interface TeachingAssistantQuery {
  courseId?: number;
}
