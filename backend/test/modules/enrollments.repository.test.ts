import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../../src/config/db';
import {
  create,
  findCourse,
  findCourseStudents,
  findStudentCourses,
  remove,
} from '../../src/modules/enrollments.repository';

vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

const mockedQuery = vi.mocked(query);

describe('enrollments.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findStudentCourses', () => {
    it('returns enrolled courses for a student with expected SQL and params', async () => {
      const rows = [
        {
          id: 101,
          name: 'Database Systems',
          code: 'CS301',
          level: 3,
          department_id: 1,
          doctor_id: 12,
          enrolled_at: new Date('2026-10-01T10:00:00Z'),
        },
      ];
      mockedQuery.mockResolvedValueOnce({ rows } as never);

      const result = await findStudentCourses(5);

      expect(result).toEqual(rows);
      expect(mockedQuery).toHaveBeenCalledTimes(1);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM student_courses sc'),
        [5],
      );
    });

    it('returns an empty array when student has no enrolled courses', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

      const result = await findStudentCourses(99);

      expect(result).toEqual([]);
    });
  });

  describe('findCourseStudents', () => {
    it('returns students enrolled in a course', async () => {
      const rows = [
        {
          id: 1,
          full_name: 'Ahmed Hassan',
          student_code: '2024001',
          email: 'ahmed@example.com',
          level: 3,
          department_id: 1,
        },
      ];
      mockedQuery.mockResolvedValueOnce({ rows } as never);

      const result = await findCourseStudents(101);

      expect(result).toEqual(rows);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN students s ON s.id = sc.student_id'),
        [101],
      );
    });
  });

  describe('create', () => {
    it('inserts and returns the newly created enrollment', async () => {
      const enrollment = {
        student_id: 5,
        course_id: 101,
        enrolled_at: new Date('2026-10-02T08:30:00Z'),
      };
      mockedQuery.mockResolvedValueOnce({ rows: [enrollment] } as never);

      const result = await create({ student_id: 5, course_id: 101 });

      expect(result).toEqual(enrollment);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO student_courses'),
        [5, 101],
      );
    });

    it('propagates database errors such as duplicate enrollment', async () => {
      const dbError = Object.assign(new Error('duplicate key value'), { code: '23505' });
      mockedQuery.mockRejectedValueOnce(dbError);

      await expect(create({ student_id: 5, course_id: 101 })).rejects.toThrow(
        'duplicate key value',
      );
    });
  });

  describe('remove', () => {
    it('returns true when an enrollment row is deleted', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ student_id: 5, course_id: 101 }],
        rowCount: 1,
      } as never);

      const deleted = await remove(5, 101);

      expect(deleted).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM student_courses'),
        [5, 101],
      );
    });

    it('returns false when no matching enrollment exists', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const deleted = await remove(5, 999);

      expect(deleted).toBe(false);
    });
  });

  describe('findCourse', () => {
    it('returns the course when found', async () => {
      const course = {
        id: 101,
        name: 'Database Systems',
        code: 'CS301',
        level: 3,
        department_id: 1,
        doctor_id: 12,
      };
      mockedQuery.mockResolvedValueOnce({ rows: [course] } as never);

      const result = await findCourse(101);

      expect(result).toEqual(course);
    });

    it('returns null when course does not exist', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

      const result = await findCourse(404);

      expect(result).toBeNull();
    });
  });
});