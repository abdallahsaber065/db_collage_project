-- PostgreSQL schema adapted from original SQL Server script
-- run this file against a Postgres database to create the university tables

-- drop tables in reverse dependency order
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS labs;
DROP TABLE IF EXISTS lectures;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS prerequisites;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    departmentid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    officelocation VARCHAR(255)
);

CREATE TABLE students (
    studentid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')) NOT NULL,
    phonenumber VARCHAR(20),
    major INT,
    recordedcredithours INT,
    completedcredithours INT,
    cgpa DECIMAL(3,2),
    FOREIGN KEY (major) REFERENCES departments(departmentid)
);

CREATE TABLE employees (
    employeeid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')) NOT NULL,
    phonenumber VARCHAR(20),
    departmentid INT,
    position VARCHAR(255),
    salary DECIMAL(10,2),
    hiredate DATE,
    FOREIGN KEY (departmentid) REFERENCES departments(departmentid)
);

CREATE TABLE courses (
    courseid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    credithours INT,
    departmentid INT,
    FOREIGN KEY (departmentid) REFERENCES departments(departmentid)
);

CREATE TABLE prerequisites (
    courseid INT,
    prerequisiteid INT,
    PRIMARY KEY (courseid, prerequisiteid),
    FOREIGN KEY (courseid) REFERENCES courses(courseid),
    FOREIGN KEY (prerequisiteid) REFERENCES courses(courseid)
);

CREATE TABLE rooms (
    roomnumber INT PRIMARY KEY,
    building VARCHAR(255),
    capacity INT,
    roomtype VARCHAR(20) CHECK (roomtype IN ('Lecture Hall', 'Lab'))
);

CREATE TABLE lectures (
    lectureid SERIAL PRIMARY KEY,
    courseid INT NOT NULL,
    instructorid INT,
    roomnumber INT,
    day VARCHAR(20),
    starttime TIME,
    endtime TIME,
    FOREIGN KEY (courseid) REFERENCES courses(courseid),
    FOREIGN KEY (instructorid) REFERENCES employees(employeeid),
    FOREIGN KEY (roomnumber) REFERENCES rooms(roomnumber)
);

CREATE TABLE labs (
    labid SERIAL PRIMARY KEY,
    courseid INT NOT NULL,
    instructorid INT,
    roomnumber INT,
    day VARCHAR(20),
    starttime TIME,
    endtime TIME,
    FOREIGN KEY (courseid) REFERENCES courses(courseid),
    FOREIGN KEY (instructorid) REFERENCES employees(employeeid),
    FOREIGN KEY (roomnumber) REFERENCES rooms(roomnumber)
);

CREATE TABLE registrations (
    registrationid SERIAL PRIMARY KEY,
    studentid INT,
    courseid INT,
    lectureid INT,
    labid INT,
    registrationdate DATE,
    grade VARCHAR(10),
    FOREIGN KEY (studentid) REFERENCES students(studentid),
    FOREIGN KEY (courseid) REFERENCES courses(courseid),
    FOREIGN KEY (lectureid) REFERENCES lectures(lectureid),
    FOREIGN KEY (labid) REFERENCES labs(labid)
);
