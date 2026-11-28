import { QueryResultRow } from 'pg';
import { query } from '../../config/db';

export const DB_SCHEMA = {
  departments: ['id', 'name', 'code'],
  doctors: ['id', 'full_name', 'email', 'department_id'],
  courses: ['id', 'name', 'code', 'level', 'department_id', 'doctor_id'],
  teaching_assistants: ['id', 'full_name', 'email', 'course_id'],
  students: [
    'id',
    'full_name',
    'student_code',
    'email',
    'level',
    'gpa',
    'total_gpa',
    'department_id',
  ],
  student_courses: ['student_id', 'course_id', 'enrolled_at'],
} as const satisfies Record<string, readonly string[]>;

export type TableName = keyof typeof DB_SCHEMA;
export type ColumnName<T extends TableName> = (typeof DB_SCHEMA)[T][number];

export interface UpdateColumn<T extends TableName = TableName> {
  column: ColumnName<T>;
  value: unknown;
}

const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function isValidTableName(table: string): table is TableName {
  return IDENTIFIER_PATTERN.test(table) && Object.prototype.hasOwnProperty.call(DB_SCHEMA, table);
}

export function assertValidTable(table: string): asserts table is TableName {
  if (!isValidTableName(table)) {
    throw new Error(`Invalid or unknown table: ${table}`);
  }
}

export function getAllowedColumns(table: TableName): ReadonlySet<string> {
  return new Set(DB_SCHEMA[table]);
}

export function assertValidColumns(
  table: TableName,
  columns: readonly string[],
  disallowedColumns: ReadonlySet<string> = new Set(['id']),
): void {
  const allowed = getAllowedColumns(table);

  for (const col of columns) {
    if (!IDENTIFIER_PATTERN.test(col) || !allowed.has(col)) {
      throw new Error(`Invalid column "${col}" for table "${table}"`);
    }
    if (disallowedColumns.has(col)) {
      throw new Error(`Column "${col}" is not allowed in this operation on table "${table}"`);
    }
  }
}

export async function updateById<
  TTable extends TableName,
  TRow extends QueryResultRow = QueryResultRow,
>(
  table: TTable,
  id: number,
  updates: readonly UpdateColumn<TTable>[],
  disallowedColumns: ReadonlySet<string> = new Set(['id']),
): Promise<TRow | null> {
  assertValidTable(table);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid id: ${id}`);
  }

  if (updates.length === 0) {
    throw new Error('Updates array must not be empty');
  }

  assertValidColumns(
    table,
    updates.map((u) => u.column),
    disallowedColumns,
  );

  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `"${column}" = $${index + 1}`)
    .join(', ');

  const result = await query<TRow>(
    `UPDATE "${table}" SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );

  return result.rows[0] ?? null;
}

export async function existsById(table: TableName, id: number): Promise<boolean> {
  assertValidTable(table);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid id: ${id}`);
  }

  const result = await query<{ id: number }>(`SELECT id FROM "${table}" WHERE id = $1`, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}