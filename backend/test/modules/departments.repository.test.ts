import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateById } from '../../src/modules/shared/CRUDS';
import {
  create,
  findAll,
  findById,
  findDetails,
  remove,
  update,
} from '../../src/modules/departments.repository';
import { query } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/modules/shared/CRUDS', () => ({
  updateById: vi.fn(),
}));

const mockedQuery = vi.mocked(query);
const mockedUpdateById = vi.mocked(updateById);

describe('Departments Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('يجلب جميع الأقسام مرتبة حسب id عند عدم تمرير code', async () => {
      const mockDepartments = [
        { id: 1, name: 'Computer Science', code: 'CS' },
        { id: 2, name: 'Information Systems', code: 'IS' },
      ];
      mockedQuery.mockResolvedValueOnce({ rows: mockDepartments } as any);

      const result = await findAll();

      expect(mockedQuery).toHaveBeenCalledOnce();
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code FROM departments ORDER BY id',
      );
      expect(result).toEqual(mockDepartments);
    });

    it('يجلب الأقسام المطابقة عند تمرير code', async () => {
      const mockDepartments = [{ id: 1, name: 'Computer Science', code: 'CS' }];
      mockedQuery.mockResolvedValueOnce({ rows: mockDepartments } as any);

      const result = await findAll('CS');

      expect(mockedQuery).toHaveBeenCalledOnce();
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code FROM departments WHERE code = $1 ORDER BY id',
        ['CS'],
      );
      expect(result).toEqual(mockDepartments);
    });
  });

  describe('findById', () => {
    it('يرجع القسم عند العثور عليه', async () => {
      const mockDept = { id: 1, name: 'Computer Science', code: 'CS' };
      mockedQuery.mockResolvedValueOnce({ rows: [mockDept] } as any);

      const result = await findById(1);

      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code FROM departments WHERE id = $1',
        [1],
      );
      expect(result).toEqual(mockDept);
    });

    it('يرجع null عندما لا يوجد قسم بالـ id المطلوب', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findDetails', () => {
    it('يرجع null ولا يستعلم عن الأطباء أو المقررات إذا كان القسم غير موجود', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await findDetails(999);

      expect(mockedQuery).toHaveBeenCalledOnce();
      expect(result).toBeNull();
    });

    it('يرجع تفاصيل القسم شاملة قائمة الأطباء والمقررات', async () => {
      const mockDept = { id: 1, name: 'Computer Science', code: 'CS' };
      const mockDoctors = [
        { id: 10, full_name: 'Dr. Ahmed', email: 'ahmed@nu.edu.eg', department_id: 1 },
      ];
      const mockCourses = [
        { id: 100, name: 'Algorithms', code: 'CS201', level: 2, department_id: 1, doctor_id: 10 },
      ];

      mockedQuery
        .mockResolvedValueOnce({ rows: [mockDept] } as any)
        .mockResolvedValueOnce({ rows: mockDoctors } as any)
        .mockResolvedValueOnce({ rows: mockCourses } as any);

      const result = await findDetails(1);

      expect(mockedQuery).toHaveBeenCalledTimes(3);
      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        'SELECT id, full_name, email, department_id FROM doctors WHERE department_id = $1 ORDER BY id',
        [1],
      );
      expect(mockedQuery).toHaveBeenNthCalledWith(
        3,
        'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE department_id = $1 ORDER BY id',
        [1],
      );
      expect(result).toEqual({
        ...mockDept,
        doctors: mockDoctors,
        courses: mockCourses,
      });
    });
  });

  describe('create', () => {
    it('ينشئ قسمًا جديدًا ويرجع السجل المُنشأ', async () => {
      const input = { name: 'Software Engineering', code: 'SE' };
      const createdDept = { id: 3, ...input };
      mockedQuery.mockResolvedValueOnce({ rows: [createdDept] } as any);

      const result = await create(input);

      expect(mockedQuery).toHaveBeenCalledWith(
        'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING id, name, code',
        ['Software Engineering', 'SE'],
      );
      expect(result).toEqual(createdDept);
    });
  });

  describe('update', () => {
    it('يمرر الحقول المُحدّثة فقط إلى updateById', async () => {
      const updatedDept = { id: 1, name: 'Updated CS', code: 'CS' };
      mockedUpdateById.mockResolvedValueOnce(updatedDept);

      const result = await update(1, { name: 'Updated CS' });

      expect(mockedUpdateById).toHaveBeenCalledWith('departments', 1, [
        { column: 'name', value: 'Updated CS' },
      ]);
      expect(result).toEqual(updatedDept);
    });

    it('يمرر مصفوفة فارغة عند عدم تمرير أي حقول للتحديث', async () => {
      mockedUpdateById.mockResolvedValueOnce(null);

      const result = await update(1, {});

      expect(mockedUpdateById).toHaveBeenCalledWith('departments', 1, []);
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('يرجع true عند حذف السجل بنجاح', async () => {
      mockedQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] } as any);

      const result = await remove(1);

      expect(mockedQuery).toHaveBeenCalledWith(
        'DELETE FROM departments WHERE id = $1 RETURNING id',
        [1],
      );
      expect(result).toBe(true);
    });

    it('يرجع false عندما لا يوجد سجل لحذفه (rowCount = 0)', async () => {
      mockedQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] } as any);

      const result = await remove(999);

      expect(result).toBe(false);
    });

    it('يرجع false عندما يكون rowCount مساويًا لـ null', async () => {
      mockedQuery.mockResolvedValueOnce({ rowCount: null, rows: [] } as any);

      const result = await remove(999);

      expect(result).toBe(false);
    });
  });
});