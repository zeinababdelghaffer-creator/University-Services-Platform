// Talks to the REST API from university_api_documentation.md.
// If no API base URL is set, an in-memory mock with the same behaviour is used,
// so the demo works before the backend is ready.
const KEY = 'uni_api_base'
export const getBase = () => { try { return localStorage.getItem(KEY) || import.meta.env.VITE_API_URL || '' } catch { return import.meta.env.VITE_API_URL || '' } }
export const setBase = (v) => { try { localStorage.setItem(KEY, v.trim().replace(/\/$/, '')) } catch { /* ignore */ } }
export const isMock = () => !getBase()

// ---------- Real API ----------
async function http(method, path, body) {
  const res = await fetch(getBase() + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { const j = await res.json(); msg = j.message || j.error || msg } catch { /* no body */ }
    if (res.status === 409) msg = 'That value already exists (code, email or student code must be unique).'
    throw new Error(msg)
  }
  return res.status === 204 ? null : res.json()
}
const qs = (p = {}) => {
  const e = Object.entries(p).filter(([, v]) => v !== '' && v != null)
  return e.length ? '?' + new URLSearchParams(e) : ''
}

// ---------- Mock data ----------
const db = {
  departments: [{ id: 1, name: 'Computer Science', code: 'CS' }, { id: 2, name: 'Information Systems', code: 'IS' }],
  doctors: [
    { id: 1, full_name: 'Dr. Ahmed Hassan', email: 'ahmed.hassan@uni.edu', department_id: 1 },
    { id: 2, full_name: 'Dr. Mona Ali', email: 'mona.ali@uni.edu', department_id: 2 },
  ],
  courses: [
    { id: 1, name: 'Data Structures', code: 'CS201', level: 2, department_id: 1, doctor_id: 1 },
    { id: 2, name: 'Databases', code: 'IS301', level: 3, department_id: 2, doctor_id: 2 },
  ],
  'teaching-assistants': [{ id: 1, full_name: 'Omar Khaled', email: 'omar.k@uni.edu', course_id: 1 }],
  students: [
    { id: 1, full_name: 'Sara Mahmoud', student_code: '2023001', email: 'sara@uni.edu', level: 2, gpa: 3.45, total_gpa: 3.3, department_id: 1 },
    { id: 2, full_name: 'Youssef Adel', student_code: '2023002', email: 'youssef@uni.edu', level: 3, gpa: 3.1, total_gpa: 3.0, department_id: 2 },
  ],
}
let enrollments = [{ student_id: 1, course_id: 1, enrolled_at: '2026-09-20' }]
let nextId = 100
const UNIQUE = { departments: ['code'], doctors: ['email'], courses: ['code'], 'teaching-assistants': ['email'], students: ['email', 'student_code'] }
const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120))
const clash = (r, data, id) => (UNIQUE[r] || []).some((k) => db[r].some((x) => x.id !== id && data[k] && x[k] === data[k]))
const conflict = () => { const e = new Error('That value already exists (code, email or student code must be unique).'); e.status = 409; return e }

// ---------- Public functions ----------
export async function list(r, params = {}) {
  if (!isMock()) return http('GET', `/api/${r}${qs(params)}`)
  let rows = db[r]
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v == null) continue
    if (k === 'search') rows = rows.filter((x) => JSON.stringify(x).toLowerCase().includes(String(v).toLowerCase()))
    else rows = rows.filter((x) => String(x[snake(k)]) === String(v))
  }
  return wait(rows)
}
export async function create(r, data) {
  if (!isMock()) return http('POST', `/api/${r}`, data)
  if (clash(r, data)) throw conflict()
  const row = { ...data, id: nextId++ }
  db[r].push(row)
  return wait(row)
}
export async function update(r, id, data) {
  if (!isMock()) return http('PATCH', `/api/${r}/${id}`, data)
  if (clash(r, data, id)) throw conflict()
  const row = db[r].find((x) => x.id === id)
  Object.assign(row, data)
  return wait(row)
}
export async function remove(r, id) {
  if (!isMock()) return http('DELETE', `/api/${r}/${id}`)
  db[r] = db[r].filter((x) => x.id !== id)
  // Mirror the DB's referential rules
  if (r === 'departments') {
    const cids = db.courses.filter((c) => c.department_id === id).map((c) => c.id)
    db.courses = db.courses.filter((c) => c.department_id !== id)
    enrollments = enrollments.filter((e) => !cids.includes(e.course_id))
    db.doctors.forEach((d) => d.department_id === id && (d.department_id = null))
    db.students.forEach((s) => s.department_id === id && (s.department_id = null))
  }
  if (r === 'doctors') db.courses.forEach((c) => c.doctor_id === id && (c.doctor_id = null))
  if (r === 'courses') {
    enrollments = enrollments.filter((e) => e.course_id !== id)
    db['teaching-assistants'].forEach((t) => t.course_id === id && (t.course_id = null))
  }
  if (r === 'students') enrollments = enrollments.filter((e) => e.student_id !== id)
  return wait(null)
}
export async function studentCourses(studentId) {
  if (!isMock()) return http('GET', `/api/students/${studentId}/courses`)
  return wait(enrollments.filter((e) => e.student_id === studentId).map((e) => ({ ...db.courses.find((c) => c.id === e.course_id), enrolled_at: e.enrolled_at })).filter((c) => c.id))
}
export async function enroll(student_id, course_id) {
  if (!isMock()) return http('POST', '/api/enrollments', { student_id, course_id })
  if (enrollments.some((e) => e.student_id === student_id && e.course_id === course_id)) throw conflict()
  enrollments.push({ student_id, course_id, enrolled_at: new Date().toISOString().slice(0, 10) })
  return wait(null)
}
export async function unenroll(studentId, courseId) {
  if (!isMock()) return http('DELETE', `/api/enrollments/${studentId}/${courseId}`)
  enrollments = enrollments.filter((e) => !(e.student_id === studentId && e.course_id === courseId))
  return wait(null)
}