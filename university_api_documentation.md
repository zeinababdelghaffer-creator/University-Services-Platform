# University Management System — REST API Endpoints

هذا المستند يوضح جميع الـ **REST API Endpoints** الخاصة بنظام إدارة الكلية/الجامعة، والمصممة بناءً على هيكل قاعدة البيانات (PostgreSQL Schema) والعلاقات بين الجداول.

---

## 1. Departments (`/api/departments`)

إدارة الأقسام الأكاديمية داخل الكلية.

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | جلب جميع الأقسام | `?code=CS` (اختياري للفلترة) |
| `GET` | `/api/departments/:id` | جلب تفاصيل قسم محدد مع الدكاترة والمواد التابعة له | `id` (Path Param) |
| `POST` | `/api/departments` | إنشاء قسم جديد | `{ "name": "...", "code": "..." }` |
| `PATCH` | `/api/departments/:id` | تعديل بيانات قسم محدد | `{ "name"?: "...", "code"?: "..." }` |
| `DELETE` | `/api/departments/:id` | حذف قسم (يحذف مواده تلقائياً ويجعل مرجع الدكاترة والطلاب `NULL`) | `id` (Path Param) |

---

## 2. Doctors (`/api/doctors`)

إدارة أعضاء هيئة التدريس (الدكاترة) وربطهم بالأقسام.

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors` | جلب جميع الدكاترة | `?departmentId=1` |
| `GET` | `/api/doctors/:id` | جلب بيانات دكتور محدد وقسمه والمواد التي يدرسها | `id` (Path Param) |
| `POST` | `/api/doctors` | إضافة دكتور جديد | `{ "full_name": "...", "email": "...", "department_id": 1 }` |
| `PATCH` | `/api/doctors/:id` | تعديل بيانات دكتور أو تغيير قسمه | `{ "full_name"?: "...", "email"?: "...", "department_id"?: 2 \| null }` |
| `DELETE` | `/api/doctors/:id` | حذف دكتور (يجعل `doctor_id` في المواد المرتبطة به `NULL`) | `id` (Path Param) |

---

## 3. Courses (`/api/courses`)

إدارة المقررات الدراسية وربطها بالأقسام والدكاترة.

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | جلب جميع المواد الدراسية | `?departmentId=1&level=2&doctorId=5` |
| `GET` | `/api/courses/:id` | جلب تفاصيل مادة مع الدكتور، المعيدين، وعدد الطلاب المسجلين | `id` (Path Param) |
| `POST` | `/api/courses` | إضافة مادة جديدة | `{ "name": "...", "code": "...", "level": 1, "department_id": 1, "doctor_id": 5 }` |
| `PATCH` | `/api/courses/:id` | تعديل بيانات مادة أو تغيير الدكتور المسؤول عنها | `{ "name"?: "...", "code"?: "...", "level"?: 2, "doctor_id"?: 6 \| null }` |
| `DELETE` | `/api/courses/:id` | حذف مادة (يحذف تسجيلات الطلاب فيها ويفك ارتباط المعيدين بها) | `id` (Path Param) |

---

## 4. Teaching Assistants (`/api/teaching-assistants`)

إدارة الهيئة المعاونة (المعيدين) وربطهم بالمقررات.

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teaching-assistants` | جلب جميع المعيدين | `?courseId=10` |
| `GET` | `/api/teaching-assistants/:id` | جلب بيانات معيد محدد والمادة المرتبط بها | `id` (Path Param) |
| `POST` | `/api/teaching-assistants` | إضافة معيد جديد | `{ "full_name": "...", "email": "...", "course_id": 10 }` |
| `PATCH` | `/api/teaching-assistants/:id` | تعديل بيانات معيد أو نقله لمادة أخرى | `{ "full_name"?: "...", "email"?: "...", "course_id"?: 12 \| null }` |
| `DELETE` | `/api/teaching-assistants/:id` | حذف معيد | `id` (Path Param) |

---

## 5. Students (`/api/students`)

إدارة بيانات الطلاب، مستوياتهم الدراسية، والمعدل التراكمي (`GPA`).

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | جلب جميع الطلاب مع الفلترة والبحث | `?departmentId=1&level=3&search=2023001` |
| `GET` | `/api/students/:id` | جلب ملف طالب كامل مع قسمه والمواد المسجل بها | `id` (Path Param) |
| `POST` | `/api/students` | تسجيل طالب جديد | `{ "full_name": "...", "student_code": "...", "email": "...", "level": 1, "gpa": 0.00, "total_gpa": 0.00, "department_id": 1 }` |
| `PATCH` | `/api/students/:id` | تحديث بيانات طالب أو درجاته أو مستواه الدراسي | `{ "level"?: 2, "gpa"?: 3.45, "total_gpa"?: 3.30, "department_id"?: 2 \| null }` |
| `DELETE` | `/api/students/:id` | حذف طالب (يحذف جميع سجلاته في جدول المواد تلقائياً) | `id` (Path Param) |

---

## 6. Enrollments / Student Courses (`/api/enrollments`)

إدارة تسجيل الطلاب في المواد الدراسية (علاقة `Many-to-Many`).

| Method | Endpoint | الوصف | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students/:studentId/courses` | جلب جميع المواد المسجل بها طالب معين وتاريخ تسجيل كل مادة | `studentId` (Path Param) |
| `GET` | `/api/courses/:courseId/students` | جلب قائمة جميع الطلاب المسجلين في مادة محددة | `courseId` (Path Param) |
| `POST` | `/api/enrollments` | تسجيل طالب في مادة دراسية | `{ "student_id": 100, "course_id": 10 }` |
| `DELETE` | `/api/enrollments/:studentId/:courseId` | إلغاء تسجيل طالب من مادة معينة (إسقاط مادة) | `studentId`, `courseId` (Path Params) |

---

## ملاحظات تقنية للتنفيذ (Implementation Notes)

* **التحقق من المدخلات (Validation):**
  * التأكد من أن قيم `gpa` و `total_gpa` تقع ضمن النطاق المعتمد في الكلية (مثلاً من `0.00` إلى `4.00`).
  * التأكد من عدم تكرار الحقول الفريدة (`code` للأقسام والمواد، `email` للأفراد، `student_code` للطلاب) وإرجاع رمز الحالة `409 Conflict` عند التكرار.
* **سلوك الحذف (Referential Integrity):**
  * حذف قسم (`departments`) يؤدي لحذف جميع مواده (`ON DELETE CASCADE`) وتصفير مرجع القسم (`ON DELETE SET NULL`) لدى الدكاترة والطلاب.
  * حذف مادة (`courses`) أو طالب (`students`) يحذف تلقائياً سجلات الربط الخاصة بهما في `student_courses`.