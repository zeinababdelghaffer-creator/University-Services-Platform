// Validation rules mirror the API notes: GPA range 0-4, required fields, email format.
const REQUIRED = {
  departments: ['name', 'code'],
  doctors: ['full_name', 'email'],
  courses: ['name', 'code', 'level'],
  'teaching-assistants': ['full_name', 'email'],
  students: ['full_name', 'student_code', 'email', 'level'],
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validate(resource, data) {
  const errors = []
  for (const key of REQUIRED[resource] || []) {
    const v = data[key]
    if (v === undefined || v === null || String(v).trim() === '') errors.push(`${key} is required`)
  }
  if (data.email && !EMAIL.test(data.email)) errors.push('email is not a valid address')
  for (const key of ['gpa', 'total_gpa']) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const n = Number(data[key])
      if (Number.isNaN(n) || n < 0 || n > 4) errors.push(`${key} must be between 0.00 and 4.00`)
    }
  }
  if (data.level !== undefined && data.level !== null && data.level !== '') {
    const l = Number(data.level)
    if (!Number.isInteger(l) || l < 1 || l > 4) errors.push('level must be a whole number from 1 to 4')
  }
  return errors
}