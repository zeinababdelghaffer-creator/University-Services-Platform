import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../../../src/config/db';
import {
  assertValidColumns,
  assertValidTable,
  DB_SCHEMA,
  existsById,
  getAllowedColumns,
  isValidTableName,
  updateById,
} from '../../../src/modules/shared/CRUDS';

vi.mock('../../../src/config/db', () => ({
  query: vi.fn(),
}));

const mockedQuery = vi.mocked(query);

describe('Schema & Identifier Validation', () => {
  it('validates known table names accurately', () => {
    expect(isValidTableName('students')).toBe(true);
    expect(isValidTableName('student_courses')).toBe(true);
    expect(isValidTableName('users')).toBe(false);
    expect(isValidTableName('students; DROP TABLE students;--')).toBe(false);
    expect(isValidTableName('__proto__')).toBe(false);
  });

  it('asserts valid tables and throws on invalid ones', () => {
    expect(() => assertValidTable('courses')).not.toThrow();
    expect(() => assertValidTable('invalid_table')).toThrow('Invalid or unknown table: invalid_table');
  });

  it('returns allowed columns for a table', () => {
    const cols = getAllowedColumns('doctors');
    expect(cols).toBeInstanceOf(Set);
    expect(cols.has('full_name')).toBe(true);
    expect(cols.has('gpa')).toBe(false);
  });

  it('validates allowed columns and blocks disallowed ones by default', () => {
    expect(() => assertValidColumns('students', ['full_name', 'gpa'])).not.toThrow();
    expect(() => assertValidColumns('students', ['id'])).toThrow(
      'Column "id" is not allowed in this operation on table "students"',
    );
    expect(() => assertValidColumns('students', ['unknown_col'])).toThrow(
      'Invalid column "unknown_col" for table "students"',
    );
  });

  it('respects custom disallowedColumns sets', () => {
    expect(() =>
      assertValidColumns('doctors', ['email'], new Set(['email'])),
    ).toThrow('Column "email" is not allowed in this operation on table "doctors"');

    expect(() =>
      assertValidColumns('students', ['id'], new Set()),
    ).not.toThrow();
  });

  it('keeps DB_SCHEMA keys aligned with expected tables', () => {
    expect(Object.keys(DB_SCHEMA)).toEqual([
      'departments',
      'doctors',
      'courses',
      'teaching_assistants',
      'students',
      'student_courses',
    ]);
  });
});

describe('updateById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes parameterized UPDATE query and returns updated row', async () => {
    const updatedStudent = {
      id: 5,
      full_name: 'Ahmed Ali',
      gpa: 3.85,
    };

    mockedQuery.mockResolvedValueOnce({
      rows: [updatedStudent],
      rowCount: 1,
    } as never);

    const result = await updateById('students', 5, [
      { column: 'full_name', value: 'Ahmed Ali' },
      { column: 'gpa', value: 3.85 },
    ]);

    expect(result).toEqual(updatedStudent);
    expect(mockedQuery).toHaveBeenCalledTimes(1);

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toBe(
      'UPDATE "students" SET "full_name" = $1, "gpa" = $2 WHERE id = $3 RETURNING *',
    );
    expect(params).toEqual(['Ahmed Ali', 3.85, 5]);
  });

  it('returns null when no row matches the id', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as never);

    const result = await updateById('courses', 999, [{ column: 'name', value: 'Algorithms' }]);

    expect(result).toBeNull();
  });

  it('throws on invalid id, empty updates, or disallowed columns without calling query', async () => {
    await expect(
      updateById('students', 0, [{ column: 'full_name', value: 'Test' }]),
    ).rejects.toThrow('Invalid id: 0');

    await expect(
      updateById('students', -2, [{ column: 'full_name', value: 'Test' }]),
    ).rejects.toThrow('Invalid id: -2');

    await expect(
      updateById('students', 1.5, [{ column: 'full_name', value: 'Test' }]),
    ).rejects.toThrow('Invalid id: 1.5');

    await expect(updateById('students', 1, [])).rejects.toThrow(
      'Updates array must not be empty',
    );

    await expect(
      updateById('students', 1, [{ column: 'id', value: 10 }]),
    ).rejects.toThrow('Column "id" is not allowed in this operation on table "students"');

    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('existsById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when rowCount is greater than 0', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: 3 }],
      rowCount: 1,
    } as never);

    const exists = await existsById('departments', 3);

    expect(exists).toBe(true);
    expect(mockedQuery).toHaveBeenCalledWith('SELECT id FROM "departments" WHERE id = $1', [3]);
  });

  it('returns false when rowCount is 0 or null', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as never);
    await expect(existsById('departments', 3)).resolves.toBe(false);

    mockedQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: null,
    } as never);
    await expect(existsById('departments', 3)).resolves.toBe(false);
  });

  it('throws on invalid id without querying the database', async () => {
    await expect(existsById('doctors', -1)).rejects.toThrow('Invalid id: -1');
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});