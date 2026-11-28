import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../../src/config/db';
import { updateById } from '../../src/modules/shared/CRUDS';
import {
  create,
  findAll,
  findById,
  findDetails,
  remove,
  update,
} from '../../src/modules/teaching-assistants.repository';

vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/modules/shared/CRUDS', () => ({
  updateById: vi.fn(),
}));

const mockedQuery = vi.mocked(query);
const mockedUpdateById = vi.mocked(updateById);

describe('teaching-assistants repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all teaching assistants when courseId is undefined', async () => {
      const rows = [
        { id: 1, full_name: 'Ahmed Eid', email: 'ahmed@example.com', course_id: 10 },
        { id: 2, full_name: 'Sara Ali', email: 'sara@example.com', course_id: null },
      ];
      mockedQuery.mockResolvedValueOnce({ rows, rowCount: 2 } as never);

      const result = await findAll();

      expect(result).toEqual(rows);
      expect(mockedQuery).toHaveBeenCalledTimes(1);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, full_name, email, course_id FROM teaching_assistants ORDER BY id'),
      );
    });

    it('should filter by courseId when provided', async () => {
      const rows = [
        { id: 1, full_name: 'Ahmed Eid', email: 'ahmed@example.com', course_id: 10 },
      ];
      mockedQuery.mockResolvedValueOnce({ rows, rowCount: 1 } as never);

      const result = await findAll(10);

      expect(result).toEqual(rows);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE course_id = $1 ORDER BY id'),
        [10],
      );
    });
  });

  describe('findById', () => {
    it('should return the teaching assistant when found', async () => {
      const ta = { id: 1, full_name: 'Ahmed Eid', email: 'ahmed@example.com', course_id: 10 };
      mockedQuery.mockResolvedValueOnce({ rows: [ta], rowCount: 1 } as never);

      const result = await findById(1);

      expect(result).toEqual(ta);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1],
      );
    });

    it('should return null when no teaching assistant matches the id', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findDetails', () => {
    it('should return null when teaching assistant does not exist', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findDetails(404);

      expect(result).toBeNull();
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('should return assistant with course null when course_id is null', async () => {
      const ta = { id: 2, full_name: 'Sara Ali', email: 'sara@example.com', course_id: null };
      mockedQuery.mockResolvedValueOnce({ rows: [ta], rowCount: 1 } as never);

      const result = await findDetails(2);

      expect(result).toEqual({ ...ta, course: null });
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('should return assistant with course details when course_id exists', async () => {
      const ta = { id: 1, full_name: 'Ahmed Eid', email: 'ahmed@example.com', course_id: 10 };
      const course = {
        id: 10,
        name: 'Database Systems',
        code: 'CS302',
        level: 3,
        department_id: 1,
        doctor_id: 5,
      };

      mockedQuery
        .mockResolvedValueOnce({ rows: [ta], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [course], rowCount: 1 } as never);

      const result = await findDetails(1);

      expect(result).toEqual({ ...ta, course });
      expect(mockedQuery).toHaveBeenCalledTimes(2);
      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE id = $1',
        [10],
      );
    });
  });

  describe('create', () => {
    it('should insert and return the created teaching assistant', async () => {
      const input = {
        full_name: 'Ahmed Eid',
        email: 'ahmed@example.com',
        course_id: 10,
      };
      const created = { id: 1, ...input };
      mockedQuery.mockResolvedValueOnce({ rows: [created], rowCount: 1 } as never);

      const result = await create(input);

      expect(result).toEqual(created);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO teaching_assistants (full_name, email, course_id)'),
        [input.full_name, input.email, input.course_id],
      );
    });
  });

  describe('update', () => {
    it('should call findById and skip updateById when no fields are provided', async () => {
      const existing = { id: 1, full_name: 'Ahmed Eid', email: 'ahmed@example.com', course_id: 10 };
      mockedQuery.mockResolvedValueOnce({ rows: [existing], rowCount: 1 } as never);

      const result = await update(1, {});

      expect(result).toEqual(existing);
      expect(mockedUpdateById).not.toHaveBeenCalled();
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('should pass only defined fields to updateById', async () => {
      const updated = {
        id: 1,
        full_name: 'Ahmed Updated',
        email: 'ahmed@example.com',
        course_id: null,
      };
      mockedUpdateById.mockResolvedValueOnce(updated as never);

      const result = await update(1, { full_name: 'Ahmed Updated', course_id: null });

      expect(result).toEqual(updated);
      expect(mockedUpdateById).toHaveBeenCalledWith('teaching_assistants', 1, [
        { column: 'full_name', value: 'Ahmed Updated' },
        { column: 'course_id', value: null },
      ]);
    });
  });

  describe('remove', () => {
    it('should return true when a row is deleted', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as never);

      const result = await remove(1);

      expect(result).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith(
        'DELETE FROM teaching_assistants WHERE id = $1 RETURNING id',
        [1],
      );
    });

    it('should return false when no row is deleted', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await remove(999);

      expect(result).toBe(false);
    });
  });
});