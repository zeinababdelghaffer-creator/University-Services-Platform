import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate } from '../src/validate.js'

test('accepts a valid student', () => {
  const s = { full_name: 'Sara', student_code: '2023001', email: 'sara@uni.edu', level: 2, gpa: 3.5, total_gpa: 3.2 }
  assert.deepEqual(validate('students', s), [])
})
test('rejects GPA above 4', () => {
  const s = { full_name: 'A', student_code: '1', email: 'a@b.co', level: 1, gpa: 4.5 }
  assert.ok(validate('students', s).some((e) => e.includes('gpa')))
})
test('requires department name and code', () => {
  assert.equal(validate('departments', {}).length, 2)
})
test('rejects bad email', () => {
  assert.ok(validate('doctors', { full_name: 'Dr X', email: 'nope' }).some((e) => e.includes('email')))
})