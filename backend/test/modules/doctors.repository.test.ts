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
} from '../../src/modules/doctors.repository';
import type { Doctor, DoctorCourse, DoctorDepartment } from '../../src/types/doctors.types';

vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/modules/shared/CRUDS', () => ({
  updateById: vi.fn(),
}));

const mockedQuery = vi.mocked(query);
const mockedUpdateById = vi.mocked(updateById);

describe('Doctors Repository Unit Tests', () => {
  const sampleDoctor: Doctor = {
    id: 1,
    full_name: 'د. أحمد محمود',
    email: 'ahmed@example.com',
    department_id: 10,
  };

  const sampleDepartment: DoctorDepartment = {
    id: 10,
    name: 'علوم الحاسب',
    code: 'CS',
  };

  const sampleCourses: DoctorCourse[] = [
    {
      id: 101,
      name: 'هندسة البرمجيات',
      code: 'SE301',
      level: 3,
      department_id: 10,
      doctor_id: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('يجب أن يرجع جميع الأطباء عندما لا يتم تمرير departmentId', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [sampleDoctor], rowCount: 1 } as never);

      const result = await findAll();

      expect(result).toEqual([sampleDoctor]);
      expect(mockedQuery).toHaveBeenCalledTimes(1);
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, full_name, email, department_id FROM doctors ORDER BY id',
      );
    });

    it('يجب أن يفلتر الأطباء حسب departmentId عند تمريره', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [sampleDoctor], rowCount: 1 } as never);

      const result = await findAll(10);

      expect(result).toEqual([sampleDoctor]);
      expect(mockedQuery).toHaveBeenCalledTimes(1);
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, full_name, email, department_id FROM doctors WHERE department_id = $1 ORDER BY id',
        [10],
      );
    });
  });

  describe('findById', () => {
    it('يجب أن يرجع بيانات الطبيب عند وجوده', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [sampleDoctor], rowCount: 1 } as never);

      const result = await findById(1);

      expect(result).toEqual(sampleDoctor);
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, full_name, email, department_id FROM doctors WHERE id = $1',
        [1],
      );
    });

    it('يجب أن يرجع null عندما لا يكون الطبيب موجوداً', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findDetails', () => {
    it('يجب أن يرجع null إذا لم يتم العثور على الطبيب', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await findDetails(999);

      expect(result).toBeNull();
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('يجب أن يرجع تفاصيل الطبيب مع القسم والمقررات عندما يكون department_id موجوداً', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [sampleDoctor], rowCount: 1 } as never) // findById
        .mockResolvedValueOnce({ rows: [sampleDepartment], rowCount: 1 } as never) // department
        .mockResolvedValueOnce({ rows: sampleCourses, rowCount: 1 } as never); // courses

      const result = await findDetails(1);

      expect(result).toEqual({
        ...sampleDoctor,
        department: sampleDepartment,
        courses: sampleCourses,
      });
      expect(mockedQuery).toHaveBeenCalledTimes(3);
    });

    it('يجب أن يرجع department بقيمة null دون استعلام القسم إذا كان department_id يساوي null', async () => {
      const doctorWithoutDept: Doctor = { ...sampleDoctor, department_id: null };

      mockedQuery
        .mockResolvedValueOnce({ rows: [doctorWithoutDept], rowCount: 1 } as never) // findById
        .mockResolvedValueOnce({ rows: sampleCourses, rowCount: 1 } as never); // courses

      const result = await findDetails(1);

      expect(result).toEqual({
        ...doctorWithoutDept,
        department: null,
        courses: sampleCourses,
      });
      expect(mockedQuery).toHaveBeenCalledTimes(2);
      expect(mockedQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('FROM departments'),
        expect.anything(),
      );
    });
  });

  describe('create', () => {
    it('يجب أن ينشئ طبيباً جديداً ويرجع السجل المضاف', async () => {
      const input = {
        full_name: 'د. أحمد محمود',
        email: 'ahmed@example.com',
        department_id: 10,
      };
      mockedQuery.mockResolvedValueOnce({ rows: [sampleDoctor], rowCount: 1 } as never);

      const result = await create(input);

      expect(result).toEqual(sampleDoctor);
      expect(mockedQuery).toHaveBeenCalledWith(
        'INSERT INTO doctors (full_name, email, department_id) VALUES ($1, $2, $3) RETURNING id, full_name, email, department_id',
        [input.full_name, input.email, input.department_id],
      );
    });
  });

  describe('update', () => {
    it('يجب أن يمرر الحقول المعرّفة فقط إلى updateById', async () => {
      const updatedDoctor: Doctor = { ...sampleDoctor, full_name: 'د. أحمد الجديد' };
      mockedUpdateById.mockResolvedValueOnce(updatedDoctor);

      const result = await update(1, { full_name: 'د. أحمد الجديد' });

      expect(result).toEqual(updatedDoctor);
      expect(mockedUpdateById).toHaveBeenCalledWith('doctors', 1, [
        { column: 'full_name', value: 'د. أحمد الجديد' },
      ]);
    });

    it('يجب أن يدعم تمرير department_id بقيمة null لتفريغ القسم', async () => {
      const updatedDoctor: Doctor = { ...sampleDoctor, department_id: null };
      mockedUpdateById.mockResolvedValueOnce(updatedDoctor);

      const result = await update(1, { department_id: null });

      expect(result).toEqual(updatedDoctor);
      expect(mockedUpdateById).toHaveBeenCalledWith('doctors', 1, [
        { column: 'department_id', value: null },
      ]);
    });
  });

  describe('remove', () => {
    it('يجب أن يرجع true عند حذف سجل موجود', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as never);

      const result = await remove(1);

      expect(result).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith(
        'DELETE FROM doctors WHERE id = $1 RETURNING id',
        [1],
      );
    });

    it('يجب أن يرجع false عند عدم وجود سجل للحذف', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const result = await remove(999);

      expect(result).toBe(false);
    });
  });
});