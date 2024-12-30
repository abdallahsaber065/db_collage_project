-- Data seeding script for the PostgreSQL schema

-- Insert data into Departments
INSERT INTO departments (name, officelocation) VALUES
('Computer Science', 'Building A'),
('Electrical Engineering', 'Building B'),
('Mechanical Engineering', 'Building C'),
('Civil Engineering', 'Building D');

-- Insert data into Students
INSERT INTO students (name, gender, phonenumber, major, recordedcredithours, completedcredithours, cgpa) VALUES
('Ahmed Ali', 'Male', '1234567890', 1, 30, 20, 3.5),
('Fatima Hassan', 'Female', '0987654321', 2, 40, 35, 3.8),
('Omar Khaled', 'Male', '1122334455', 3, 50, 45, 3.2),
('Sara Mohamed', 'Female', '5566778899', 4, 60, 55, 3.9);

-- Insert data into Employees
INSERT INTO employees (name, gender, phonenumber, departmentid, position, salary, hiredate) VALUES
('Dr. Ali Mahmoud', 'Male', '1231231234', 1, 'Professor', 80000, '2010-08-15'),
('Dr. Mona Youssef', 'Female', '3213214321', 2, 'Associate Professor', 75000, '2012-09-20'),
('Dr. Hassan Ibrahim', 'Male', '4564564567', 3, 'Assistant Professor', 70000, '2015-01-10'),
('Dr. Layla Ahmed', 'Female', '6546546543', 4, 'Lecturer', 65000, '2018-05-25');

-- Insert data into Courses
INSERT INTO courses (name, credithours, departmentid) VALUES
('Introduction to Programming', 3, 1),
('Circuit Analysis', 4, 2),
('Thermodynamics', 3, 3),
('Structural Analysis', 4, 4);

-- Insert data into Prerequisites
INSERT INTO prerequisites (courseid, prerequisiteid) VALUES
(2, 1),
(3, 1),
(4, 1),
(4, 2);

-- Insert data into Rooms
INSERT INTO rooms (roomnumber, building, capacity, roomtype) VALUES
(101, 'Building A', 50, 'Lecture Hall'),
(102, 'Building B', 30, 'Lab'),
(103, 'Building C', 40, 'Lecture Hall'),
(104, 'Building D', 20, 'Lab');

-- Insert data into Lectures
INSERT INTO lectures (courseid, instructorid, roomnumber, day, starttime, endtime) VALUES
(1, 1, 101, 'Monday', '09:00', '10:30'),
(2, 2, 102, 'Tuesday', '11:00', '12:30'),
(3, 3, 103, 'Wednesday', '13:00', '14:30'),
(4, 4, 104, 'Thursday', '15:00', '16:30');

-- Insert data into Labs
INSERT INTO labs (courseid, instructorid, roomnumber, day, starttime, endtime) VALUES
(1, 1, 102, 'Monday', '10:30', '12:00'),
(2, 2, 104, 'Tuesday', '12:30', '14:00'),
(3, 3, 102, 'Wednesday', '14:30', '16:00'),
(4, 4, 104, 'Thursday', '16:30', '18:00');

-- Insert data into Registrations
INSERT INTO registrations (studentid, courseid, lectureid, labid, registrationdate, grade) VALUES
(1, 1, 1, 1, '2023-01-10', 'A'),
(2, 2, 2, 2, '2023-01-11', 'B'),
(3, 3, 3, 3, '2023-01-12', 'A'),
(4, 4, 4, 4, '2023-01-13', 'B');
