CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    level INT NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE teaching_assistants (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    student_code VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    level INT NOT NULL,
    gpa DECIMAL(3, 2),
    total_gpa DECIMAL(3, 2),
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE student_courses (
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id)
);