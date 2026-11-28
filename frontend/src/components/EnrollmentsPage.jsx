import { useCallback, useEffect, useState } from 'react'
import * as api from '../api.js'

export default function EnrollmentsPage({ notify }) {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [enrolled, setEnrolled] = useState([])

  useEffect(() => {
    Promise.all([api.list('students'), api.list('courses')]).then(([s, c]) => {
      setStudents(s); setCourses(c)
      if (s[0]) setStudentId(String(s[0].id))
      if (c[0]) setCourseId(String(c[0].id))
    }).catch((e) => notify(e.message, true))
  }, [notify])

  const load = useCallback(async () => {
    if (!studentId) return setEnrolled([])
    try { setEnrolled(await api.studentCourses(Number(studentId))) } catch (e) { notify(e.message, true) }
  }, [studentId, notify])
  useEffect(() => { load() }, [load])

  const attempt = async (fn) => { try { await fn() } catch (e) { notify(e.message, true) } }
  const enroll = () => attempt(async () => {
    if (!courseId) return notify('Choose a course first', true)
    await api.enroll(Number(studentId), Number(courseId)); notify('Enrolled'); await load()
  })
  const drop = (c) => attempt(async () => { await api.unenroll(Number(studentId), c.id); notify('Course dropped'); await load() })

  return (
    <>
      <div className="head"><div><h2>Enrollments</h2>
        <p className="sub">Choose a student to see their courses, enroll them in a new one, or drop a course.</p></div></div>
      <div className="enroll">
        <select aria-label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
        </select>
        <select aria-label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
        <button className="primary" onClick={enroll} disabled={!studentId}>Enroll student</button>
      </div>
      {!studentId ? <div className="empty">Add a student first to manage enrollments.</div>
        : enrolled.length === 0 ? <div className="empty">This student has no courses yet. Pick a course above and enroll.</div>
        : (
          <div className="wrap"><table>
            <thead><tr><th>Code</th><th>Course</th><th>Level</th><th>Enrolled on</th><th /></tr></thead>
            <tbody>{enrolled.map((c) => (
              <tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.level}</td><td>{String(c.enrolled_at ?? '—')}</td>
                <td className="act"><button className="small danger" onClick={() => drop(c)}>Drop course</button></td></tr>
            ))}</tbody>
          </table></div>
        )}
    </>
  )
}