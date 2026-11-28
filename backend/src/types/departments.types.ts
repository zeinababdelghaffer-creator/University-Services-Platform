export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface DepartmentDoctor {
  id: number;
  full_name: string;
  email: string;
  department_id: number | null;
}

export interface DepartmentCourse {
  id: number;
  name: string;
  code: string;
  level: number;
  department_id: number | null;
  doctor_id: number | null;
}

export interface DepartmentDetails extends Department {
  doctors: DepartmentDoctor[];
  courses: DepartmentCourse[];
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
}

export interface DepartmentQuery {
  code?: string;
}
