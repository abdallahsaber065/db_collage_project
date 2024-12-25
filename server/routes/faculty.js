const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../db');

// Get all employees
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT * FROM Employees');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Employees WHERE EmployeeID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new employee
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
        OUTPUT INSERTED.*
        VALUES (@name, @gender, @phoneNumber, @departmentID, @position, @salary, @hireDate)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating employee:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  const { Name, Gender, PhoneNumber, DepartmentID, Position, Salary, HireDate } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if employee exists
      const employeeCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Employees WHERE EmployeeID = @id');
      
      if (employeeCheck.recordset.length === 0) {
        throw new Error('Employee not found');
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

      // Update employee
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
          OUTPUT INSERTED.*
          WHERE EmployeeID = @id
        `);

      await transaction.commit();
      res.json(result.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(err.message.includes('not found') ? 404 : 400)
      .json({ message: err.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if employee exists
      const employeeCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Employees WHERE EmployeeID = @id');
      
      if (employeeCheck.recordset.length === 0) {
        throw new Error('Employee not found');
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
          throw new Error(`This employee is teaching: ${dependencies.join(' and ')}. Do you want to delete these as well?`);
        }
      }

      // Delete employee
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Employees WHERE EmployeeID = @id');

      await transaction.commit();
      res.json({ 
        message: 'Employee deleted successfully',
        hadDependencies: LectureCount > 0 || LabCount > 0
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 