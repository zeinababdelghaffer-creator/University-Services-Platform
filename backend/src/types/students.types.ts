export interface StudentRow {
  id: number;
  full_name: string;
  student_code: string;
  email: string;
  level: number;
  gpa: number | string | null;
  total_gpa: number | string | null;
  department_id: number | null;
}

export interface Student extends Omit<StudentRow, 'gpa' | 'total_gpa'> {
  gpa: number | string | null;
  total_gpa: number | string | null;
}

export interface StudentDepartment {
  id: number;
  name: string;
  code: string;
}

export interface StudentCourse {
  id: number;
  name: string;
  code: string;
  level: number;
  department_id: number | null;
  doctor_id: number | null;
  enrolled_at: Date | null;
}

export interface StudentDetails extends Student {
  department: StudentDepartment | null;
  courses: StudentCourse[];
}

export interface CreateStudentInput {
  full_name: string;
  student_code: string;
  email: string;
  level: number;
  gpa?: number | null;
  total_gpa?: number | null;
  department_id: number;
}

export interface UpdateStudentInput {
  level?: number;
  gpa?: number | null;
  total_gpa?: number | null;
  department_id?: number | null;
}

export interface StudentQuery {
  departmentId?: number;
  level?: number;
  search?: string;
}
