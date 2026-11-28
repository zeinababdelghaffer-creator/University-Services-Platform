export interface Doctor {
  id: number;
  full_name: string;
  email: string;
  department_id: number | null;
}

export interface DoctorDepartment {
  id: number;
  name: string;
  code: string;
}

export interface DoctorCourse {
  id: number;
  name: string;
  code: string;
  level: number;
  department_id: number | null;
  doctor_id: number | null;
}

export interface DoctorDetails extends Doctor {
  department: DoctorDepartment | null;
  courses: DoctorCourse[];
}

export interface CreateDoctorInput {
  full_name: string;
  email: string;
  department_id?: number | null;
}

export interface UpdateDoctorInput {
  full_name?: string;
  email?: string;
  department_id?: number | null;
}

export interface DoctorQuery {
  departmentId?: number;
}
