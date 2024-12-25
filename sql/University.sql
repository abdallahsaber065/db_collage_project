USE University;
GO

-- drop tables if they exist
DROP TABLE IF EXISTS Registrations;
DROP TABLE IF EXISTS Labs;
DROP TABLE IF EXISTS Lectures;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Prerequisites;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Departments;


CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    OfficeLocation VARCHAR(255)
);

CREATE TABLE Students (
    StudentID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female')) NOT NULL,
    PhoneNumber VARCHAR(20),
    Major INT,
    RecordedCreditHours INT,
    CompletedCreditHours INT,
    CGPA DECIMAL(3,2),
    FOREIGN KEY (Major) REFERENCES Departments(DepartmentID)
);

CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female')) NOT NULL,
    PhoneNumber VARCHAR(20),
    DepartmentID INT,
    Position VARCHAR(255),
    Salary DECIMAL(10,2),
    HireDate DATE,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE Courses (
    CourseID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    CreditHours INT,
    DepartmentID INT,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE Prerequisites (
    CourseID INT,
    PrerequisiteID INT,
    PRIMARY KEY (CourseID, PrerequisiteID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (PrerequisiteID) REFERENCES Courses(CourseID)
);

CREATE TABLE Rooms (
    RoomNumber INT PRIMARY KEY,
    Building VARCHAR(255),
    Capacity INT,
    RoomType VARCHAR(20) CHECK (RoomType IN ('Lecture Hall', 'Lab'))
);

CREATE TABLE Lectures (
    LectureID INT PRIMARY KEY IDENTITY(1,1),
    CourseID INT NOT NULL,
    InstructorID INT,
    RoomNumber INT,
    Day VARCHAR(20),
    StartTime TIME(0),
    EndTime TIME(0),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (RoomNumber) REFERENCES Rooms(RoomNumber)
);

CREATE TABLE Labs (
    LabID INT PRIMARY KEY IDENTITY(1,1),
    CourseID INT NOT NULL,
    InstructorID INT,
    RoomNumber INT,
    Day VARCHAR(20),
    StartTime TIME(0),
    EndTime TIME(0),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (RoomNumber) REFERENCES Rooms(RoomNumber)
);

CREATE TABLE Registrations (
    RegistrationID INT PRIMARY KEY IDENTITY(1,1),
    StudentID INT,
    CourseID INT,
    LectureID INT,
    LabID INT NULL,
    RegistrationDate DATE,
    Grade VARCHAR(10),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (LectureID) REFERENCES Lectures(LectureID),
    FOREIGN KEY (LabID) REFERENCES Labs(LabID)
);
