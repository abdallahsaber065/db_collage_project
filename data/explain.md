# GUI Documentation

## Overview

This is a full-stack web application for managing university operations, built with Node.js/Express (backend) and React (frontend). The system handles students, courses, faculty, departments, and course registrations.

## System Architecture

### Backend (@server)

- **Technology Stack**: Node.js, Express
- **Database**: Microsoft SQL Server

### Frontend (@client)

- **Technology Stack**: ReactJS

## Database Operations and Queries

### Key Database Features

1. **Transaction Management**
   - Implemented in critical operations like:

   ```javascript
   const transaction = new sql.Transaction(pool);
   try {
     await transaction.begin();
     // Database operations
     await transaction.commit();
   } catch (err) {
     await transaction.rollback();
     throw err;
   }
   ```

   - This ensures data integrity and consistency in operations like course registration, grade management, and student records.

2. **Complex Joins**
   Example from registrations query:

   ```sql
   SELECT r.*, 
     s.Name as StudentName,
     c.Name as CourseName,
     l.Day as LectureDay,
     CONVERT(varchar(5), l.StartTime, 108) as LectureStartTime
   FROM Registrations r
   JOIN Students s ON r.StudentID = s.StudentID
   JOIN Courses c ON r.CourseID = c.CourseID
   JOIN Lectures l ON r.LectureID = l.LectureID
   ```

   **Explanation**: This query fetches registration details along with student, course, and lecture information.
   **Output**: StudentName, CourseName, LectureDay, LectureStartTime

3. **Schedule Conflict Detection**

   ```sql
   SELECT * FROM Lectures l1
   JOIN Registrations r ON l1.LectureID = r.LectureID
   JOIN Lectures l2 ON l2.LectureID = @lectureId
   WHERE r.StudentID = @studentId
   AND l1.Day = l2.Day
   AND (
     (l1.StartTime BETWEEN l2.StartTime AND l2.EndTime)
     OR (l1.EndTime BETWEEN l2.StartTime AND l2.EndTime)
     OR (l2.StartTime BETWEEN l1.StartTime AND l1.EndTime)
   )
   ```

   **Explanation**: This query checks for schedule conflicts between a new lecture and existing registrations of a student.
   **Output**: Conflicting lecture details ex. LectureID, Day, StartTime etc.

4. **Cascading Deletions with Dependency Checks**
   Example from department deletion:

   ```sql
   SELECT 
     (SELECT COUNT(*) FROM Students WHERE Major = @id) as StudentCount,
     (SELECT COUNT(*) FROM Employees WHERE DepartmentID = @id) as EmployeeCount,
     (SELECT COUNT(*) FROM Courses WHERE DepartmentID = @id) as CourseCount
   ```

   **Explanation**: This query checks for dependencies before deleting a department to prevent data loss.
   **Output**: StudentCount, EmployeeCount, CourseCount

### Key Database Operations

1. **Course Registration System**
   - Prerequisites validation
   - Schedule conflict checking
   - Grade management
   - Lab section handling

2. **Faculty Management**
   - Teaching assignments tracking (courses, lectures, labs)
   - Department association
   - Salary and position tracking

3. **Student Records**
   - Credit hour tracking
   - CGPA calculation
   - Major declaration
   - Registration history

## UI/UX Features

### Data Tables

- Sortable columns
- Action buttons for edit/delete
- Responsive design

### Error Handling

- Client-side validation
- Server error messages display
- Transaction rollback notifications

## Security Considerations

1. **Database Security**
   - Parameterized queries to prevent SQL injection
   - Transaction management for data integrity

2. **API Security**
   - Input validation
   - Error handling
   - CORS configuration

## Deployment

- Backend & Frontend: Vercel
- Database: Microsoft SQL Server
