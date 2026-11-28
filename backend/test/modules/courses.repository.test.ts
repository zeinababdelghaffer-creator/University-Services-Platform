import { describe, it, expect, vi, beforeEach } from 'vitest';
import { query } from '../../src/config/db';
import { updateById } from '../../src/modules/shared/CRUDS';
import * as coursesRepo from '../../src/modules/courses.repository'; // عدّل المسار حسب اسم ملفك
import { Course, CourseDoctor, CourseTeachingAssistant } from '../../src/types/courses.types';

// عزل التبعيات الخارجية (قاعدة البيانات ودالة updateById المشتركة)
vi.mock('../../src/config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/modules/shared/CRUDS', () => ({
  updateById: vi.fn(),
}));

const mockedQuery = vi.mocked(query);
const mockedUpdateById = vi.mocked(updateById);

// دالة مساعدة لتوليد استجابة تشبه pg QueryResult
function mockQueryResult<T>(rows: T[], rowCount: number | null = rows.length) {
  return {
    rows,
    rowCount,
    command: '',
    oid: 0,
    fields: [],
  };
}

describe('Courses Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. findAll
  // ==========================================
  describe('findAll', () => {
    const sampleCourses: Course[] = [
      { id: 1, name: 'Algorithms', code: 'CS301', level: 3, department_id: 10, doctor_id: 5 },
      { id: 2, name: 'Databases', code: 'CS302', level: 3, department_id: 10, doctor_id: null },
    ];

    it('should fetch all courses without WHERE clause when no filters are provided', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult(sampleCourses));

      const result = await coursesRepo.findAll({});

      expect(mockedQuery).toHaveBeenCalledTimes(1);
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code, level, department_id, doctor_id FROM courses  ORDER BY id',
        [],
      );
      expect(result).toEqual(sampleCourses);
    });

    it('should build dynamic WHERE clause with all filters in correct parameter order', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([sampleCourses[0]]));

      const result = await coursesRepo.findAll({
        departmentId: 10,
        level: 3,
        doctorId: 5,
      });

      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE department_id = $1 AND level = $2 AND doctor_id = $3 ORDER BY id',
        [10, 3, 5],
      );
      expect(result).toEqual([sampleCourses[0]]);
    });

    it('should filter by a single parameter (e.g., level)', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult(sampleCourses));

      await coursesRepo.findAll({ level: 3 });

      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE level = $1 ORDER BY id',
        [3],
      );
    });
  });

  // ==========================================
  // 2. findById
  // ==========================================
  describe('findById', () => {
    it('should return the course when found', async () => {
      const course: Course = {
        id: 1,
        name: 'Operating Systems',
        code: 'CS305',
        level: 3,
        department_id: 10,
        doctor_id: 2,
      };
      mockedQuery.mockResolvedValueOnce(mockQueryResult([course]));

      const result = await coursesRepo.findById(1);

      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT id, name, code, level, department_id, doctor_id FROM courses WHERE id = $1',
        [1],
      );
      expect(result).toEqual(course);
    });

    it('should return null when course does not exist', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([]));

      const result = await coursesRepo.findById(999);

      expect(result).toBeNull();
    });
  });

  // ==========================================
  // 3. findDetails
  // ==========================================
  describe('findDetails', () => {
    const baseCourse: Course = {
      id: 1,
      name: 'Networks',
      code: 'CS310',
      level: 3,
      department_id: 10,
      doctor_id: 7,
    };

    const sampleDoctor: CourseDoctor = {
      id: 7,
      full_name: 'Dr. Ahmed Ali',
      email: 'ahmed@univ.edu',
      department_id: 10,
    };

    const sampleTAs: CourseTeachingAssistant[] = [
      { id: 101, full_name: 'Sara Mahmoud', email: 'sara@univ.edu', course_id: 1 },
      { id: 102, full_name: 'Omar Hassan', email: 'omar@univ.edu', course_id: 1 },
    ];

    it('should return null immediately if course is not found', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([]));

      const result = await coursesRepo.findDetails(404);

      expect(result).toBeNull();
      expect(mockedQuery).toHaveBeenCalledTimes(1); // لم يتم استدعاء استعلامات التفاصيل
    });

    it('should return full course details including doctor, TAs, and numeric enrolled_count', async () => {
      mockedQuery
        .mockResolvedValueOnce(mockQueryResult([baseCourse])) // 1. findById
        .mockResolvedValueOnce(mockQueryResult([sampleDoctor])) // 2. doctor
        .mockResolvedValueOnce(mockQueryResult(sampleTAs)) // 3. teaching_assistants
        .mockResolvedValueOnce(mockQueryResult([{ enrolled_count: '42' }])); // 4. count

      const result = await coursesRepo.findDetails(1);

      expect(mockedQuery).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        ...baseCourse,
        doctor: sampleDoctor,
        teaching_assistants: sampleTAs,
        enrolled_count: 42, // تم تحويلها من string إلى number
      });
    });

    it('should skip doctor query and set doctor to null when course.doctor_id is null', async () => {
      const courseWithoutDoctor: Course = { ...baseCourse, doctor_id: null };

      mockedQuery
        .mockResolvedValueOnce(mockQueryResult([courseWithoutDoctor])) // 1. findById
        .mockResolvedValueOnce(mockQueryResult([])) // 2. teaching_assistants
        .mockResolvedValueOnce(mockQueryResult([{ enrolled_count: '0' }])); // 3. count

      const result = await coursesRepo.findDetails(1);

      expect(mockedQuery).toHaveBeenCalledTimes(3); // 3 استعلامات فقط بدون استعلام doctors
      expect(result).toEqual({
        ...courseWithoutDoctor,
        doctor: null,
        teaching_assistants: [],
        enrolled_count: 0,
      });
    });

    it('should set doctor to null if doctor_id exists on course but doctor record is missing', async () => {
      mockedQuery
        .mockResolvedValueOnce(mockQueryResult([baseCourse]))
        .mockResolvedValueOnce(mockQueryResult([])) // الدكتور غير موجود
        .mockResolvedValueOnce(mockQueryResult([]))
        .mockResolvedValueOnce(mockQueryResult([{ enrolled_count: '5' }]));

      const result = await coursesRepo.findDetails(1);

      expect(result?.doctor).toBeNull();
      expect(result?.enrolled_count).toBe(5);
    });
  });

  // ==========================================
  // 4. create
  // ==========================================
  describe('create', () => {
    it('should insert a new course and return the created record', async () => {
      const input = {
        name: 'Artificial Intelligence',
        code: 'CS401',
        level: 4,
        department_id: 10,
        doctor_id: null,
      };
      const createdCourse: Course = { id: 15, ...input };

      mockedQuery.mockResolvedValueOnce(mockQueryResult([createdCourse]));

      const result = await coursesRepo.create(input);

      expect(mockedQuery).toHaveBeenCalledWith(
        'INSERT INTO courses (name, code, level, department_id, doctor_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, code, level, department_id, doctor_id',
        ['Artificial Intelligence', 'CS401', 4, 10, null],
      );
      expect(result).toEqual(createdCourse);
    });
  });

  // ==========================================
  // 5. update
  // ==========================================
  describe('update', () => {
    it('should map only defined fields and delegate to updateById', async () => {
      const updatedCourse: Course = {
        id: 1,
        name: 'Advanced Algorithms',
        code: 'CS301',
        level: 3,
        department_id: 10,
        doctor_id: null,
      };
      mockedUpdateById.mockResolvedValueOnce(updatedCourse);

      const result = await coursesRepo.update(1, {
        name: 'Advanced Algorithms',
        doctor_id: null, // قيمة صريحة بـ null يجب تضمينها
      });

      expect(mockedUpdateById).toHaveBeenCalledWith('courses', 1, [
        { column: 'name', value: 'Advanced Algorithms' },
        { column: 'doctor_id', value: null },
      ]);
      expect(result).toEqual(updatedCourse);
    });

    it('should pass an empty array when no update fields are provided', async () => {
      mockedUpdateById.mockResolvedValueOnce(null);

      const result = await coursesRepo.update(1, {});

      expect(mockedUpdateById).toHaveBeenCalledWith('courses', 1, []);
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // 6. remove
  // ==========================================
  describe('remove', () => {
    it('should return true when a row is deleted', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([{ id: 1 }], 1));

      const result = await coursesRepo.remove(1);

      expect(mockedQuery).toHaveBeenCalledWith(
        'DELETE FROM courses WHERE id = $1 RETURNING id',
        [1],
      );
      expect(result).toBe(true);
    });

    it('should return false when no row matches the id (rowCount = 0)', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([], 0));

      const result = await coursesRepo.remove(999);

      expect(result).toBe(false);
    });

    it('should return false when rowCount is null', async () => {
      mockedQuery.mockResolvedValueOnce(mockQueryResult([], null));

      const result = await coursesRepo.remove(999);

      expect(result).toBe(false);
    });
  });
});