const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../db');

/**
 * @param {unknown} err
 * @returns {string}
 */
function getMessage(err) {
  return err instanceof Error ? err.message : String(err);
}


// Get all registrations
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .query(`
        SELECT r.*,
          s.Name as StudentName,
          c.Name as CourseName,
          l.Day as LectureDay,
          TO_CHAR(l.StartTime, 'HH24:MI') as LectureStartTime,
          TO_CHAR(l.EndTime, 'HH24:MI') as LectureEndTime,
          lab.Day as LabDay,
          TO_CHAR(lab.StartTime, 'HH24:MI') as LabStartTime,
          TO_CHAR(lab.EndTime, 'HH24:MI') as LabEndTime
        FROM Registrations r
        JOIN Students s ON r.StudentID = s.StudentID
        JOIN Courses c ON r.CourseID = c.CourseID
        JOIN Lectures l ON r.LectureID = l.LectureID
        LEFT JOIN Labs lab ON r.LabID = lab.LabID
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Get registration by ID
router.get('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT r.*,
          s.Name as StudentName,
          c.Name as CourseName,
          l.Day as LectureDay,
          TO_CHAR(l.StartTime, 'HH24:MI') as LectureStartTime,
          TO_CHAR(l.EndTime, 'HH24:MI') as LectureEndTime,
          lab.Day as LabDay,
          TO_CHAR(lab.StartTime, 'HH24:MI') as LabStartTime,
          TO_CHAR(lab.EndTime, 'HH24:MI') as LabEndTime
        FROM Registrations r
        JOIN Students s ON r.StudentID = s.StudentID
        JOIN Courses c ON r.CourseID = c.CourseID
        JOIN Lectures l ON r.LectureID = l.LectureID
        LEFT JOIN Labs lab ON r.LabID = lab.LabID
        WHERE r.RegistrationID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching registration:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Create new registration
router.post('/', async (req, res) => {
  const { StudentID, CourseID, LectureID, LabID, Grade } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if student exists
      const studentCheck = await new sql.Request(transaction)
        .input('studentId', sql.Int, StudentID)
        .query('SELECT * FROM Students WHERE StudentID = @studentId');

      if (studentCheck.recordset.length === 0) {
        throw new Error('Student not found');
      }

      // Check if course exists
      const courseCheck = await new sql.Request(transaction)
        .input('courseId', sql.Int, CourseID)
        .query('SELECT * FROM Courses WHERE CourseID = @courseId');

      if (courseCheck.recordset.length === 0) {
        throw new Error('Course not found');
      }

      // Check if lecture exists and belongs to the course
      const lectureCheck = await new sql.Request(transaction)
        .input('lectureId', sql.Int, LectureID)
        .input('courseId', sql.Int, CourseID)
        .query('SELECT * FROM Lectures WHERE LectureID = @lectureId AND CourseID = @courseId');

      if (lectureCheck.recordset.length === 0) {
        throw new Error('Invalid lecture for this course');
      }

      // Check if lab exists and belongs to the course (if provided)
      if (LabID) {
        const labCheck = await new sql.Request(transaction)
          .input('labId', sql.Int, LabID)
          .input('courseId', sql.Int, CourseID)
          .query('SELECT * FROM Labs WHERE LabID = @labId AND CourseID = @courseId');

        if (labCheck.recordset.length === 0) {
          throw new Error('Invalid lab for this course');
        }
      }

      // Check for schedule conflicts
      const scheduleCheck = await new sql.Request(transaction)
        .input('studentId', sql.Int, StudentID)
        .input('lectureId', sql.Int, LectureID)
        .query(`
          SELECT r.* 
          FROM Registrations r
          JOIN Lectures l1 ON r.LectureID = l1.LectureID
          JOIN Lectures l2 ON l2.LectureID = @lectureId
          WHERE r.StudentID = @studentId
          AND l1.Day = l2.Day
          AND (
            (l1.StartTime BETWEEN l2.StartTime AND l2.EndTime)
            OR (l1.EndTime BETWEEN l2.StartTime AND l2.EndTime)
            OR (l2.StartTime BETWEEN l1.StartTime AND l1.EndTime)
          )
        `);

      if (scheduleCheck.recordset.length > 0) {
        throw new Error('Schedule conflict with existing registration');
      }

      // Check if student is already registered for this course
      const duplicateCheck = await new sql.Request(transaction)
        .input('studentId', sql.Int, StudentID)
        .input('courseId', sql.Int, CourseID)
        .query('SELECT * FROM Registrations WHERE StudentID = @studentId AND CourseID = @courseId');

      if (duplicateCheck.recordset.length > 0) {
        throw new Error('Student is already registered for this course');
      }

      // Insert registration
      const result = await new sql.Request(transaction)
        .input('studentId', sql.Int, StudentID)
        .input('courseId', sql.Int, CourseID)
        .input('lectureId', sql.Int, LectureID)
        .input('labId', sql.Int, LabID)
        .input('registrationDate', sql.Date, new Date())
        .query(`
          INSERT INTO Registrations (StudentID, CourseID, LectureID, LabID, RegistrationDate)
          VALUES (@studentId, @courseId, @lectureId, @labId, @registrationDate)
          RETURNING *
        `);

      await transaction.commit();

      // Fetch the complete registration details
      const completeRegistration = await pool.request()
        .input('id', sql.Int, result.recordset[0].RegistrationID)
        .query(`
          SELECT r.*,
            s.Name as StudentName,
            c.Name as CourseName,
            l.Day as LectureDay,
            TO_CHAR(l.StartTime, 'HH24:MI') as LectureStartTime,
            TO_CHAR(l.EndTime, 'HH24:MI') as LectureEndTime,
            lab.Day as LabDay,
            TO_CHAR(lab.StartTime, 'HH24:MI') as LabStartTime,
            TO_CHAR(lab.EndTime, 'HH24:MI') as LabEndTime
          FROM Registrations r
          JOIN Students s ON r.StudentID = s.StudentID
          JOIN Courses c ON r.CourseID = c.CourseID
          JOIN Lectures l ON r.LectureID = l.LectureID
          LEFT JOIN Labs lab ON r.LabID = lab.LabID
          WHERE r.RegistrationID = @id
        `);

      res.status(201).json(completeRegistration.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error creating registration:", err);
    res.status(400).json({ message: getMessage(err) });
  }
});

// Update registration
router.put('/:id', async (req, res) => {
  const { LectureID, LabID, Grade } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if registration exists and get current data
      const registrationCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT r.*, c.CourseID 
          FROM Registrations r
          JOIN Courses c ON r.CourseID = c.CourseID
          WHERE r.RegistrationID = @id
        `);

      if (registrationCheck.recordset.length === 0) {
        throw new Error('Registration not found');
      }

      const currentReg = registrationCheck.recordset[0];

      // Check if lecture exists and belongs to the course
      if (LectureID) {
        const lectureCheck = await new sql.Request(transaction)
          .input('lectureId', sql.Int, LectureID)
          .input('courseId', sql.Int, currentReg.CourseID)
          .query(`
            SELECT * FROM Lectures 
            WHERE LectureID = @lectureId 
            AND CourseID = @courseId
          `);

        if (lectureCheck.recordset.length === 0) {
          throw new Error('Invalid lecture for this course');
        }

        // Check for schedule conflicts with other registrations
        const scheduleCheck = await new sql.Request(transaction)
          .input('studentId', sql.Int, currentReg.StudentID)
          .input('lectureId', sql.Int, LectureID)
          .input('registrationId', sql.Int, req.params.id)
          .query(`
            SELECT r.* 
            FROM Registrations r
            JOIN Lectures l1 ON r.LectureID = l1.LectureID
            JOIN Lectures l2 ON l2.LectureID = @lectureId
            WHERE r.StudentID = @studentId
            AND r.RegistrationID != @registrationId
            AND l1.Day = l2.Day
            AND (
              (l1.StartTime BETWEEN l2.StartTime AND l2.EndTime)
              OR (l1.EndTime BETWEEN l2.StartTime AND l2.EndTime)
              OR (l2.StartTime BETWEEN l1.StartTime AND l1.EndTime)
            )
          `);

        if (scheduleCheck.recordset.length > 0) {
          throw new Error('Schedule conflict with another registration');
        }
      }

      // Check if lab exists and belongs to the course
      if (LabID) {
        const labCheck = await new sql.Request(transaction)
          .input('labId', sql.Int, LabID)
          .input('courseId', sql.Int, currentReg.CourseID)
          .query(`
            SELECT * FROM Labs 
            WHERE LabID = @labId 
            AND CourseID = @courseId
          `);

        if (labCheck.recordset.length === 0) {
          throw new Error('Invalid lab for this course');
        }

        // Check for lab schedule conflicts
        const labScheduleCheck = await new sql.Request(transaction)
          .input('studentId', sql.Int, currentReg.StudentID)
          .input('labId', sql.Int, LabID)
          .input('registrationId', sql.Int, req.params.id)
          .query(`
            SELECT r.* 
            FROM Registrations r
            JOIN Labs l1 ON r.LabID = l1.LabID
            JOIN Labs l2 ON l2.LabID = @labId
            WHERE r.StudentID = @studentId
            AND r.RegistrationID != @registrationId
            AND l1.Day = l2.Day
            AND (
              (l1.StartTime BETWEEN l2.StartTime AND l2.EndTime)
              OR (l1.EndTime BETWEEN l2.StartTime AND l2.EndTime)
              OR (l2.StartTime BETWEEN l1.StartTime AND l1.EndTime)
            )
          `);

        if (labScheduleCheck.recordset.length > 0) {
          throw new Error('Lab schedule conflict with another registration');
        }
      }

      // Validate grade if provided
      if (Grade && !Grade.match(/^[A-F][+-]?$|^F$/)) {
        throw new Error('Invalid grade format. Must be A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, or F');
      }

      // Update registration
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('lectureId', sql.Int, LectureID || null)
        .input('labId', sql.Int, LabID || null)
        .input('grade', sql.VarChar(2), Grade || null)
        .query(`
          UPDATE Registrations
          SET LectureID = COALESCE(@lectureId::int, LectureID),
              LabID = @labId::int,
              Grade = COALESCE(@grade::varchar, Grade)
          WHERE RegistrationID = @id
          RETURNING RegistrationID,
                StudentID,
                CourseID,
                LectureID,
                LabID,
                RegistrationDate,
                Grade
        `);

      await transaction.commit();

      // Fetch the complete updated registration details with names and schedules
      const updatedRegistration = await pool.request()
        .input('id', sql.Int, result.recordset[0].RegistrationID)
        .query(`
          SELECT r.*,
            s.Name as StudentName,
            c.Name as CourseName,
            l.Day as LectureDay,
            TO_CHAR(l.StartTime, 'HH24:MI') as LectureStartTime,
            TO_CHAR(l.EndTime, 'HH24:MI') as LectureEndTime,
            lab.Day as LabDay,
            TO_CHAR(lab.StartTime, 'HH24:MI') as LabStartTime,
            TO_CHAR(lab.EndTime, 'HH24:MI') as LabEndTime
          FROM Registrations r
          JOIN Students s ON r.StudentID = s.StudentID
          JOIN Courses c ON r.CourseID = c.CourseID
          JOIN Lectures l ON r.LectureID = l.LectureID
          LEFT JOIN Labs lab ON r.LabID = lab.LabID
          WHERE r.RegistrationID = @id
        `);

      res.json(updatedRegistration.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error updating registration:", err);
    res.status(400).json({ message: getMessage(err) });
  }
});

// Delete registration
router.delete('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        DELETE FROM Registrations 
        WHERE RegistrationID = @id
        RETURNING *
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    console.error("Error deleting registration:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Get registrations by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('studentId', sql.Int, req.params.studentId)
      .query(`
        SELECT r.*,
          s.Name as StudentName,
          c.Name as CourseName,
          l.Day as LectureDay,
          TO_CHAR(l.StartTime, 'HH24:MI') as LectureStartTime,
          TO_CHAR(l.EndTime, 'HH24:MI') as LectureEndTime,
          lab.Day as LabDay,
          TO_CHAR(lab.StartTime, 'HH24:MI') as LabStartTime,
          TO_CHAR(lab.EndTime, 'HH24:MI') as LabEndTime
        FROM Registrations r
        JOIN Students s ON r.StudentID = s.StudentID
        JOIN Courses c ON r.CourseID = c.CourseID
        JOIN Lectures l ON r.LectureID = l.LectureID
        LEFT JOIN Labs lab ON r.LabID = lab.LabID
        WHERE r.StudentID = @studentId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching student registrations:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

module.exports = router; 
