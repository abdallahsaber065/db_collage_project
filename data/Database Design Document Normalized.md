# Database Design Document

This document details the normalized database schema for the university database system, including tables, keys, and constraints. The design aims to minimize redundancy and anomalies through normalization.

**1. Tables (After Normalization):**

* **Departments:**
  * `DepartmentID` (INT, PRIMARY KEY, IDENTITY(1,1))
  * `Name` (VARCHAR(255), NOT NULL)
  * `OfficeLocation` (VARCHAR(255))

* **Students:**
  * `StudentID` (INT, PRIMARY KEY, IDENTITY(1,1))
  * `Name` (VARCHAR(255), NOT NULL)
  * `Gender` (VARCHAR(10), CHECK (Gender IN ('Male', 'Female')), NOT NULL)
  * `PhoneNumber` (VARCHAR(20))
  * `Major` (INT, FOREIGN KEY referencing Departments(DepartmentID))
  * `RecordedCreditHours` (INT)
  * `CompletedCreditHours` (INT)
  * `CGPA` (DECIMAL(3,2))

* **Employees:**
  * `EmployeeID` (INT, PRIMARY KEY, IDENTITY(1,1))
  * `Name` (VARCHAR(255), NOT NULL)
  * `Gender` (VARCHAR(10), CHECK (Gender IN ('Male', 'Female')), NOT NULL)
  * `PhoneNumber` (VARCHAR(20))
  * `DepartmentID` (INT, FOREIGN KEY referencing Departments(DepartmentID))
  * `Position` (VARCHAR(255))
  * `Salary` (DECIMAL(10,2))
  * `HireDate` (DATE)

* **Courses:**
  * `CourseID` (INT, PRIMARY KEY)
  * `Name` (VARCHAR(255), NOT NULL)
  * `CreditHours` (INT)
  * `DepartmentID` (INT, FOREIGN KEY referencing Departments(DepartmentID))

* **Prerequisites:**
  * `CourseID` (INT, FOREIGN KEY referencing Courses(CourseID), PRIMARY KEY)
  * `PrerequisiteID` (INT, FOREIGN KEY referencing Courses(CourseID), PRIMARY KEY)

* **Rooms:**
  * `RoomNumber` (INT, PRIMARY KEY)
  * `Building` (VARCHAR(255))
  * `Capacity` (INT)
  * `RoomType` (VARCHAR(20), CHECK (RoomType IN ('Lecture Hall', 'Lab')))

* **Lectures:**
  * `LectureID` (INT, PRIMARY KEY)
  * `CourseID` (INT, FOREIGN KEY referencing Courses(CourseID), NOT NULL)
  * `InstructorID` (INT, FOREIGN KEY referencing Employees(EmployeeID))
  * `RoomNumber` (INT, FOREIGN KEY referencing Rooms(RoomNumber))
  * `Day` (VARCHAR(20))
  * `StartTime` (TIME)
  * `EndTime` (TIME)

* **Labs:**
  * `LabID` (INT, PRIMARY KEY)
  * `CourseID` (INT, FOREIGN KEY referencing Courses(CourseID), NOT NULL)
  * `InstructorID` (INT, FOREIGN KEY referencing Employees(EmployeeID))
  * `RoomNumber` (INT, FOREIGN KEY referencing Rooms(RoomNumber))
  * `Day` (VARCHAR(20))
  * `StartTime` (TIME)
  * `EndTime` (TIME)

* **Registrations:**
  * `RegistrationID` (INT, PRIMARY KEY)
  * `StudentID` (INT, FOREIGN KEY referencing Students(StudentID))
  * `CourseID` (INT, FOREIGN KEY referencing Courses(CourseID))
  * `LectureID` (INT, FOREIGN KEY referencing Lectures(LectureID))
  * `LabID` (INT, FOREIGN KEY referencing Labs(LabID), NULL)
  * `RegistrationDate` (DATE)
  * `Grade` (VARCHAR(10))

**2. Constraints:**

* All PRIMARY KEY constraints are enforced.
* All FOREIGN KEY constraints are enforced, ensuring referential integrity.
* NOT NULL constraints are enforced where specified, ensuring data integrity.
* CHECK constraints are used for fields like `Gender` and `RoomType` to limit the valid values.
* Unique constraints could be added to fields like `PhoneNumber` to ensure uniqueness.

**3. Normalization:**

* **First Normal Form (1NF):** All tables are in 1NF as they contain atomic values (no repeating groups).
* **Second Normal Form (2NF):** All tables are in 2NF as there are no partial dependencies. (All non-key attributes depend on the entire primary key. This was already addressed in the initial design).
* **Third Normal Form (3NF):** All tables are in 3NF as there are no transitive dependencies. (All non-key attributes depend only on the primary key and not on other non-key attributes).

**4. Functional Dependencies (FDs) and Keys:**

* **Departments:** `DepartmentID` -> `Name`, `OfficeLocation`
* **Students:** `StudentID` -> `Name`, `Gender`, `PhoneNumber`, `Major`, `RecordedCreditHours`, `CompletedCreditHours`, `CGPA`
* **Employees:** `EmployeeID` -> `Name`, `Gender`, `PhoneNumber`, `DepartmentID`, `Position`, `Salary`, `HireDate`
* **Courses:** `CourseID` -> `Name`, `CreditHours`, `DepartmentID`
* **Prerequisites:** `CourseID`, `PrerequisiteID` -> `CourseID`, `PrerequisiteID`
* **Rooms:** `RoomNumber` -> `Building`, `Capacity`, `RoomType`
* **Lectures:** `LectureID` -> `CourseID`, `InstructorID`, `RoomNumber`, `Day`, `StartTime`, `EndTime`
* **Labs:** `LabID` -> `CourseID`, `InstructorID`, `RoomNumber`, `Day`, `StartTime`, `EndTime`
* **Registrations:** `RegistrationID` -> `StudentID`, `CourseID`, `LectureID`, `LabID`, `RegistrationDate`, `Grade`
