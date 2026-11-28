// One schema drives every list page, form and table.
export const LABEL = { departments: 'name', doctors: 'full_name', courses: 'name', students: 'full_name', 'teaching-assistants': 'full_name' }

export const SCHEMA = {
  departments: { title: 'Departments', sub: 'Academic departments in the college.', fields: [
    { key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }] },
  doctors: { title: 'Doctors', sub: 'Teaching staff and their departments.', filter: 'departmentId', fields: [
    { key: 'full_name', label: 'Full name' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'department_id', label: 'Department', ref: 'departments' }] },
  courses: { title: 'Courses', sub: 'Courses, their level, and the doctor in charge.', filter: 'departmentId', fields: [
    { key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }, { key: 'level', label: 'Level', type: 'number', step: 1 },
    { key: 'department_id', label: 'Department', ref: 'departments' }, { key: 'doctor_id', label: 'Doctor', ref: 'doctors' }] },
  'teaching-assistants': { title: 'Teaching assistants', sub: 'Assistants and the course each one supports.', fields: [
    { key: 'full_name', label: 'Full name' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'course_id', label: 'Course', ref: 'courses' }] },
  students: { title: 'Students', sub: 'Student records, levels and GPA.', filter: 'departmentId', fields: [
    { key: 'full_name', label: 'Full name' }, { key: 'student_code', label: 'Student code' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'level', label: 'Level', type: 'number', step: 1 }, { key: 'gpa', label: 'GPA', type: 'number', step: 0.01 },
    { key: 'total_gpa', label: 'Total GPA', type: 'number', step: 0.01 },
    { key: 'department_id', label: 'Department', ref: 'departments' }] },
}
export const ROUTES = [...Object.keys(SCHEMA), 'enrollments']
export const NAMES = { ...Object.fromEntries(Object.entries(SCHEMA).map(([k, v]) => [k, v.title])), enrollments: 'Enrollments' }