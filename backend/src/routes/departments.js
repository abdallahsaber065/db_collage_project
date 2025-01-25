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


// Get all departments
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT * FROM Departments');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT d.*, 
          (SELECT COUNT(*)::int FROM Students WHERE Major = d.DepartmentID) as StudentCount,
          (SELECT COUNT(*)::int FROM Employees WHERE DepartmentID = d.DepartmentID) as FacultyCount,
          (SELECT COUNT(*)::int FROM Courses WHERE DepartmentID = d.DepartmentID) as CourseCount
        FROM Departments d
        WHERE d.DepartmentID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching department:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Create new department
router.post('/', async (req, res) => {
  const { Name, OfficeLocation } = req.body;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('name', sql.VarChar(255), Name)
      .input('officeLocation', sql.VarChar(255), OfficeLocation)
      .query(`
        INSERT INTO Departments (Name, OfficeLocation)
        VALUES (@name, @officeLocation)
        RETURNING *
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  const { Name, OfficeLocation } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if department exists
      const deptCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Departments WHERE DepartmentID = @id');

      if (deptCheck.recordset.length === 0) {
        throw new Error('Department not found');
      }

      // Validate name is not duplicate
      if (Name !== deptCheck.recordset[0].Name) {
        const nameCheck = await new sql.Request(transaction)
          .input('id', sql.Int, req.params.id)
          .input('name', sql.VarChar(255), Name)
          .query('SELECT * FROM Departments WHERE Name = @name AND DepartmentID != @id');

        if (nameCheck.recordset.length > 0) {
          throw new Error('A department with this name already exists');
        }
      }

      // Update department
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('name', sql.VarChar(255), Name)
        .input('officeLocation', sql.VarChar(255), OfficeLocation)
        .query(`
          UPDATE Departments
          SET Name = @name,
              OfficeLocation = @officeLocation
          WHERE DepartmentID = @id
          RETURNING *
        `);

      await transaction.commit();
      res.json(result.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(getMessage(err).includes('not found') ? 404 : 400)
      .json({ message: getMessage(err) });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if department exists
      const departmentCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Departments WHERE DepartmentID = @id');

      if (departmentCheck.recordset.length === 0) {
        throw new Error('Department not found');
      }

      // Check for dependencies
      const checkResult = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT 
            (SELECT COUNT(*)::int FROM Students WHERE Major = @id) as StudentCount,
            (SELECT COUNT(*)::int FROM Employees WHERE DepartmentID = @id) as FacultyCount,
            (SELECT COUNT(*)::int FROM Courses WHERE DepartmentID = @id) as CourseCount
        `);

      const { StudentCount, FacultyCount, CourseCount } = checkResult.recordset[0];

      if (StudentCount > 0 || FacultyCount > 0 || CourseCount > 0) {
        const dependencies = [];
        if (StudentCount > 0) dependencies.push(`${StudentCount} students`);
        if (FacultyCount > 0) dependencies.push(`${FacultyCount} faculty members`);
        if (CourseCount > 0) dependencies.push(`${CourseCount} courses`);

        throw new Error(`Cannot delete department. It has: ${dependencies.join(', ')}. Please reassign or delete these first.`);
      }

      // Delete department
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Departments WHERE DepartmentID = @id');

      await transaction.commit();
      res.json({ message: 'Department deleted successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(400).json({ message: getMessage(err) });
  }
});

module.exports = router; 
