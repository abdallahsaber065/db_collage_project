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


// Get all faculty members
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT * FROM Employees');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching faculty members:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Get faculty member by ID
router.get('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Employees WHERE EmployeeID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching faculty member:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Create new faculty member
router.post('/', async (req, res) => {
  const { Name, Gender, PhoneNumber, DepartmentID, Position, Salary, HireDate } = req.body;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('name', sql.VarChar(255), Name)
      .input('gender', sql.VarChar(10), Gender)
      .input('phoneNumber', sql.VarChar(20), PhoneNumber)
      .input('departmentID', sql.Int, DepartmentID)
      .input('position', sql.VarChar(255), Position)
      .input('salary', sql.Decimal(10,2), Salary)
      .input('hireDate', sql.Date, HireDate ? new Date(HireDate) : null)
      .query(`
        INSERT INTO Employees (Name, Gender, PhoneNumber, DepartmentID, Position, Salary, HireDate)
        VALUES (@name, @gender, @phoneNumber, @departmentID, @position, @salary, @hireDate)
        RETURNING *
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating faculty member:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

// Update faculty member
router.put('/:id', async (req, res) => {
  const { Name, Gender, PhoneNumber, DepartmentID, Position, Salary, HireDate } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if faculty member exists
      const facultyCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Employees WHERE EmployeeID = @id');
      
      if (facultyCheck.recordset.length === 0) {
        throw new Error('Faculty member not found');
      }

      // Check if department exists
      if (DepartmentID) {
        const deptCheck = await new sql.Request(transaction)
          .input('deptId', sql.Int, DepartmentID)
          .query('SELECT * FROM Departments WHERE DepartmentID = @deptId');
        
        if (deptCheck.recordset.length === 0) {
          throw new Error('Department not found');
        }
      }

      // Update faculty member
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('name', sql.VarChar(255), Name)
        .input('gender', sql.VarChar(10), Gender)
        .input('phoneNumber', sql.VarChar(20), PhoneNumber)
        .input('departmentID', sql.Int, DepartmentID)
        .input('position', sql.VarChar(255), Position)
        .input('salary', sql.Decimal(10,2), Salary)
        .input('hireDate', sql.Date, HireDate ? new Date(HireDate) : null)
        .query(`
          UPDATE Employees
          SET Name = @name,
              Gender = @gender,
              PhoneNumber = @phoneNumber,
              DepartmentID = @departmentID,
              Position = @position,
              Salary = @salary,
              HireDate = @hireDate
          WHERE EmployeeID = @id
          RETURNING *
        `);

      await transaction.commit();
      res.json(result.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error updating faculty member:", err);
      res.status(getMessage(err).includes('not found') ? 404 : 400)
      .json({ message: getMessage(err) });
  }
});

// Delete faculty member
router.delete('/:id', async (req, res) => {
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if faculty member exists
      const facultyCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Employees WHERE EmployeeID = @id');
      
      if (facultyCheck.recordset.length === 0) {
        throw new Error('Faculty member not found');
      }

      // Check for lectures and labs
      const checkResult = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM Lectures WHERE InstructorID = @id) as LectureCount,
            (SELECT COUNT(*) FROM Labs WHERE InstructorID = @id) as LabCount
        `);
      
      const { LectureCount, LabCount } = checkResult.recordset[0];
      
      if (LectureCount > 0 || LabCount > 0) {
        const dependencies = [];
        if (LectureCount > 0) dependencies.push(`${LectureCount} lectures`);
        if (LabCount > 0) dependencies.push(`${LabCount} labs`);
        
        // If force delete is requested, proceed with deletion
        if (req.query.force === 'true') {
          // Delete lectures first
          if (LectureCount > 0) {
            await new sql.Request(transaction)
              .input('id', sql.Int, req.params.id)
              .query('DELETE FROM Lectures WHERE InstructorID = @id');
          }

          // Delete labs
          if (LabCount > 0) {
            await new sql.Request(transaction)
              .input('id', sql.Int, req.params.id)
              .query('DELETE FROM Labs WHERE InstructorID = @id');
          }
        } else {
          // If not force delete, throw error with dependency information
          throw new Error(`This faculty member is teaching: ${dependencies.join(' and ')}. Do you want to delete these as well?`);
        }
      }

      // Delete faculty member
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Employees WHERE EmployeeID = @id');

      await transaction.commit();
      res.json({ 
        message: 'Faculty member deleted successfully',
        hadDependencies: LectureCount > 0 || LabCount > 0
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting faculty member:", err);
    res.status(400).json({ message: getMessage(err) });
  }
});

module.exports = router; 
