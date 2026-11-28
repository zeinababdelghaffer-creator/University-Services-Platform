import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../../src/config/db';
import { create, findAll, findDetails } from '../../src/modules/students.repository';

vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

const mockedQuery = vi.mocked(query);

describe('students repository queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('يبني شروط الفلترة ويهذّب نص البحث ويطبّع قيم GPA', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            full_name: 'أحمد عيد',
            student_code: 'STU_101',
            email: 'ahmed@example.com',
            level: 3,
            gpa: '3.75' ,
            total_gpa: null,
            department_id: 2,
          },
        ],
        rowCount: 1,
      } as never);

      const result = await findAll({
        departmentId: 2,
        level: 3,
        search: '  50%_test\\  ',
      });

      expect(mockedQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockedQuery.mock.calls[0];

      expect(sql).toContain('WHERE department_id = $1 AND level = $2 AND (');
      expect(sql).toContain("ESCAPE '\\'");
      expect(params).toEqual([2, 3, '%50\\%\\_test\\\\%']);
      expect(result).toEqual([
        {
          id: 1,
          full_name: 'أحمد عيد',
          student_code: 'STU_101',
          email: 'ahmed@example.com',
          level: 3,
          gpa: 3.75,
          total_gpa: null,
          department_id: 2,
        },
      ]);
    });

    it('يتجاهل نص البحث الفارغ أو المكون من مسافات فقط', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as never);

      await findAll({ search: '    ' });

      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
    });
  });

  describe('findDetails', () => {
    it('يعيد null عندما لا يكون الطالب موجودًا', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findDetails(999);

      expect(result).toBeNull();
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('يجمع بيانات الطالب والقسم والمقررات ويطبّع المعدلات', async () => {
      const studentRow = {
        id: 5,
        full_name: 'سارة حسن',
        student_code: 'STU_205',
        email: 'sara@example.com',
        level: 2,
        gpa: '3.4',
        total_gpa: '3.55',
        department_id: 4,
      };
      const departmentRow = { id: 4, name: 'هندسة البرمجيات', code: 'SE' };
      const coursesRows = [
        {
          id: 10,
          name: 'قواعد البيانات',
          code: 'CS202',
          level: 2,
          department_id: 4,
          doctor_id: 3,
          enrolled_at: '2026-09-01T00:00:00.000Z',
        },
      ];

      mockedQuery
        .mockResolvedValueOnce({ rows: [studentRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [departmentRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: coursesRows, rowCount: 1 } as never);

      const result = await findDetails(5);

      expect(mockedQuery).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        ...studentRow,
        gpa: "3.4",
        total_gpa: "3.55",
        department: departmentRow,
        courses: coursesRows,
      });
    });

    it('يجعل department يساوي null إذا كان department_id فارغًا', async () => {
      mockedQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 7,
              full_name: 'كريم محمود',
              student_code: 'STU_301',
              email: 'karim@example.com',
              level: 1,
              gpa: null,
              total_gpa: null,
              department_id: null,
            },
          ],
          rowCount: 1,
        } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findDetails(7);

      expect(mockedQuery).toHaveBeenCalledTimes(2);
      expect(result?.department).toBeNull();
      expect(result?.courses).toEqual([]);
    });
  });

  describe('create', () => {
    it('يدرج طالبًا جديدًا ويعيد الصف بعد تحويل قيم GPA إلى أرقام', async () => {
      const input = {
        full_name: 'مريم علي',
        student_code: 'STU_401',
        email: 'mariam@example.com',
        level: 1,
        gpa: "3.9",
        total_gpa: "3.9",
        department_id: 1,
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            ...input,
            id: 12,
            gpa: '3.9' as unknown as number,
            total_gpa: '3.9' as unknown as number,
          },
        ],
        rowCount: 1,
      } as never);

      const created = await create(input);

      expect(mockedQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO students');
      expect(sql).toContain('RETURNING');
      expect(params).toEqual([
        input.full_name,
        input.student_code,
        input.email,
        input.level,
        input.gpa,
        input.total_gpa,
        input.department_id,
      ]);
      expect(created).toEqual({
        ...input,
        id: 12,
        gpa: 3.9,
        total_gpa: 3.9,
      });
    });
  });
});