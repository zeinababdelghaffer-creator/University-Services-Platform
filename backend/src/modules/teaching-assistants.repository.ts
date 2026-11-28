import { query } from '../config/db';
import { updateById, UpdateColumn } from './shared/CRUDS';
import {
  TeachingAssistant,
  TeachingAssistantCourse,
  TeachingAssistantDetails,
  UpdateTeachingAssistantInput,
} from '../../src/types/teaching-assistants.types';

const TA_COLUMNS = 'id, full_name, email, course_id';

export async function findAll(courseId?: number): Promise<TeachingAssistant[]> {
  const result =
    courseId === undefined
      ? await query<TeachingAssistant>(
          `SELECT ${TA_COLUMNS} FROM teaching_assistants ORDER BY id`,
        )
      : await query<TeachingAssistant>(
          `SELECT ${TA_COLUMNS} FROM teaching_assistants WHERE course_id = $1 ORDER BY id`,
          [courseId],
        );
  return result.rows;
}

export async function findById(id: number): Promise<TeachingAssistant | null> {
  const result = await query<TeachingAssistant>(
    `SELECT ${TA_COLUMNS} FROM teaching_assistants WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findDetails(id: number): Promise<TeachingAssistantDetails | null> {
  const assistant = await findById(id);
  if (!assistant) {
    return null;
  }

  let course: TeachingAssistantCourse | null = null;
  if (assistant.course_id !== null) {
    const courseResult = await query<TeachingAssistantCourse>(
      'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE id = $1',
      [assistant.course_id],
    );
    course = courseResult.rows[0] ?? null;
  }

  return { ...assistant, course };
}

export async function create(input: {
  full_name: string;
  email: string;
  course_id: number | null;
}): Promise<TeachingAssistant> {
  const result = await query<TeachingAssistant>(
    `INSERT INTO teaching_assistants (full_name, email, course_id)
     VALUES ($1, $2, $3)
     RETURNING ${TA_COLUMNS}`,
    [input.full_name, input.email, input.course_id],
  );
  return result.rows[0];
}

export async function update(
  id: number,
  input: UpdateTeachingAssistantInput,
): Promise<TeachingAssistant | null> {
  const updates: UpdateColumn<'teaching_assistants'>[] = [];

  if (input.full_name !== undefined) {
    updates.push({ column: 'full_name', value: input.full_name });
  }
  if (input.email !== undefined) {
    updates.push({ column: 'email', value: input.email });
  }
  if (input.course_id !== undefined) {
    updates.push({ column: 'course_id', value: input.course_id });
  }

  if (updates.length === 0) {
    return findById(id);
  }

  return updateById<'teaching_assistants', TeachingAssistant>('teaching_assistants', id, updates);
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ id: number }>(
    'DELETE FROM teaching_assistants WHERE id = $1 RETURNING id',
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}