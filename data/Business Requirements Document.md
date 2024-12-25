# Overview

This document outlines the essential business requirements for a university database system. The system will manage information related to students, faculty, departments, courses, lectures, labs, rooms, and registrations.

## Business Requirements

### A. Student Management

* Track: Student ID, Name, Gender, Phone Number, Major (Department), Recorded Credit Hours, Completed Credit Hours, CGPA.
* Functions: View/Add/Update student information.

### B. Employee Management

* Track: Employee ID, Name, Gender, Phone Number, Department, Position, Salary, Hire Date.
* Functions: View/Add/Update employee information, assign employees to departments, manage employee roles and salaries.

### C. Department Management

* Track: Department ID, Name, Office Location.
* Functions: View/Add/Update department information, assign faculty to departments.

### D. Course Management

* Track: Course ID, Name, Credit Hours, Prerequisites (other courses), Offering Department.
* Functions: Create/Update courses.

### E. Lecture Management

* Track: Lecture ID, Course ID (required), Faculty (Instructor), Schedule (days, time, room).
* Functions: Schedule lectures, assign faculty to lectures.

### F. Lab Management

* Track: Lab ID, Course ID (required), Faculty (Instructor), Schedule (days, time, room).
* Functions: Schedule labs, assign faculty to labs, manage lab resources/equipment (if needed).

### G. Registration Management

* Track: Registration ID, Student ID, Course ID, Lecture ID (required), Lab ID (optional, if applicable), Registration Date, Grade.
* Functions: Students register/drop courses/lectures/labs, view registration status.

### H. Grading

* Track: Student ID, Course ID, Grade (overall course grade), Lecture Grade (optional), Lab Grade (optional).
* Functions: Faculty enter/update grades, students view grades.

### I. Rooms

* Track: Room Number, Building, Capacity, Room Type (Lecture Hall, Lab).
* Functions: Manage room assignments for lectures/labs.

## Key Reports

* Student enrollment reports (by department, course, lecture, lab)
* Course enrollment reports (by department)
* Faculty workload reports (by department, lectures, labs)
* Transcripts (basic format)
