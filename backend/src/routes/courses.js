const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../db');

/**
 * Normalize an unknown error to a string message.
 * @param {unknown} err
 * @returns {string}
 */
function getMessage(err) {
  return err instanceof Error ? err.message : String(err);
}


// Get all courses
router.get('/', async (req, res) => {
    try {
        await poolConnect; // ensures that the pool has been created
        const result = await pool.request()
            .query('SELECT * FROM Courses');
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({ error: getMessage(err) });
    }
});

// Get course by ID
router.get('/:id', async (req, res) => {
    try {
        await poolConnect;
        // use LIFT JOIN to include prerequisites
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
        SELECT c.*, p.PrerequisiteID,
          pc.Name as PrerequisiteName
        FROM Courses c
        LEFT JOIN Prerequisites p ON c.CourseID = p.CourseID
        LEFT JOIN Courses pc ON p.PrerequisiteID = pc.CourseID
        WHERE c.CourseID = @id
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Format response to include prerequisites as an array
        const course = result.recordset[0];
        const prerequisites = result.recordset
            .filter(r => r.PrerequisiteID)
            .map(r => ({
                id: r.PrerequisiteID,
                name: r.PrerequisiteName
            }));

        res.json({
            ...course,
            prerequisites
        });
    } catch (err) {
        console.error("Error fetching course by ID:", err);
        res.status(500).json({ error: getMessage(err) });
    }
});

// Create new course
router.post('/', async (req, res) => {
    const { Name, CreditHours, DepartmentID, Prerequisites } = req.body;
    try {
        await poolConnect;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Insert course
            const courseResult = await new sql.Request(transaction)
                .input('name', sql.VarChar(255), Name)
                .input('creditHours', sql.Int, CreditHours)
                .input('departmentID', sql.Int, DepartmentID)
                .query(`
          INSERT INTO Courses (Name, CreditHours, DepartmentID)
          VALUES (@name, @creditHours, @departmentID)
          RETURNING *
        `);

            const newCourse = courseResult.recordset[0];

            // Insert prerequisites if any
            if (Prerequisites && Prerequisites.length > 0) {
                for (const prereqId of Prerequisites) {
                    await new sql.Request(transaction)
                        .input('courseId', sql.Int, newCourse.CourseID)
                        .input('prereqId', sql.Int, prereqId)
                        .query(`
              INSERT INTO Prerequisites (CourseID, PrerequisiteID)
              VALUES (@courseId, @prereqId)
            `);
                }
            }

            await transaction.commit();
            res.status(201).json(newCourse);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Error creating course:", err);
        res.status(500).json({ error: getMessage(err) });
    }
});

// Update course
router.put('/:id', async (req, res) => {
    const { Name, CreditHours, DepartmentID, Prerequisites } = req.body;
    try {
        // use the existing pool (connection already established)
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Update course
            const result = await new sql.Request(transaction)
                .input('id', sql.Int, req.params.id)
                .input('name', sql.VarChar(255), Name)
                .input('creditHours', sql.Int, CreditHours)
                .input('departmentID', sql.Int, DepartmentID)
                .query(`
          UPDATE Courses
          SET Name = @name,
              CreditHours = @creditHours,
              DepartmentID = @departmentID
          WHERE CourseID = @id
          RETURNING *
        `);

            if (result.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Course not found' });
            }

            // Update prerequisites
            if (Prerequisites) {
                // Remove existing prerequisites
                await new sql.Request(transaction)
                    .input('courseId', sql.Int, req.params.id)
                    .query('DELETE FROM Prerequisites WHERE CourseID = @courseId');

                // Add new prerequisites
                for (const prereqId of Prerequisites) {
                    await new sql.Request(transaction)
                        .input('courseId', sql.Int, req.params.id)
                        .input('prereqId', sql.Int, prereqId)
                        .query(`
              INSERT INTO Prerequisites (CourseID, PrerequisiteID)
              VALUES (@courseId, @prereqId)
            `);
                }
            }

            await transaction.commit();
            res.json(result.recordset[0]);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: getMessage(err) });
    }
});

// Delete course
router.delete('/:id', async (req, res) => {
    try {
        await poolConnect;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Check for dependencies
            const checkResult = await new sql.Request(transaction)
                .input('id', sql.Int, req.params.id)
                .query(`
          SELECT 
            (SELECT COUNT(*) FROM Registrations WHERE CourseID = @id) as RegistrationCount,
            (SELECT COUNT(*) FROM Prerequisites WHERE CourseID = @id OR PrerequisiteID = @id) as PrerequisiteCount,
            (SELECT COUNT(*) FROM Lectures WHERE CourseID = @id) as LectureCount,
            (SELECT COUNT(*) FROM Labs WHERE CourseID = @id) as LabCount
        `);

            const { RegistrationCount, PrerequisiteCount, LectureCount, LabCount } = checkResult.recordset[0];

            if (RegistrationCount > 0 || LectureCount > 0 || LabCount > 0) {
                throw new Error('Cannot delete course with existing registrations, lectures, or labs');
            }

            // Delete prerequisites first
            await new sql.Request(transaction)
                .input('id', sql.Int, req.params.id)
                .query('DELETE FROM Prerequisites WHERE CourseID = @id OR PrerequisiteID = @id');

            // Delete course
            const result = await new sql.Request(transaction)
                .input('id', sql.Int, req.params.id)
                .query('DELETE FROM Courses WHERE CourseID = @id RETURNING *');

            if (result.recordset.length === 0) {
                throw new Error('Course not found');
            }

            await transaction.commit();
            res.json({ message: 'Course deleted successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Error deleting course:", err);
        res.status(400).json({ message: getMessage(err) });
    }
});

module.exports = router; 
