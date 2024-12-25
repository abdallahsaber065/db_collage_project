const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../db');

// Get all students
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT * FROM Students');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Students WHERE StudentID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new student
router.post('/', async (req, res) => {
  const { Name, Gender, PhoneNumber, Major, RecordedCreditHours, CompletedCreditHours, CGPA } = req.body;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('name', sql.VarChar(255), Name)
      .input('gender', sql.VarChar(10), Gender)
      .input('phoneNumber', sql.VarChar(20), PhoneNumber)
      .input('major', sql.Int, Major)
      .input('recordedCreditHours', sql.Int, RecordedCreditHours)
      .input('completedCreditHours', sql.Int, CompletedCreditHours)
      .input('cgpa', sql.Decimal(3,2), CGPA)
      .query(`
        INSERT INTO Students (Name, Gender, PhoneNumber, Major, RecordedCreditHours, CompletedCreditHours, CGPA)
        OUTPUT INSERTED.*
        VALUES (@name, @gender, @phoneNumber, @major, @recordedCreditHours, @completedCreditHours, @cgpa)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  const { Name, Gender, PhoneNumber, Major, RecordedCreditHours, CompletedCreditHours, CGPA } = req.body;
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if student exists
      const studentCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Students WHERE StudentID = @id');
      
      if (studentCheck.recordset.length === 0) {
        throw new Error('Student not found');
      }

      // Check if department exists
      if (Major) {
        const deptCheck = await new sql.Request(transaction)
          .input('deptId', sql.Int, Major)
          .query('SELECT * FROM Departments WHERE DepartmentID = @deptId');
        
        if (deptCheck.recordset.length === 0) {
          throw new Error('Department not found');
        }
      }

      // Validate credit hours
      if (CompletedCreditHours > RecordedCreditHours) {
        throw new Error('Completed credit hours cannot exceed recorded credit hours');
      }

      // Update student
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('name', sql.VarChar(255), Name)
        .input('gender', sql.VarChar(10), Gender)
        .input('phoneNumber', sql.VarChar(20), PhoneNumber)
        .input('major', sql.Int, Major)
        .input('recordedCreditHours', sql.Int, RecordedCreditHours)
        .input('completedCreditHours', sql.Int, CompletedCreditHours)
        .input('cgpa', sql.Decimal(3,2), CGPA)
        .query(`
          UPDATE Students
          SET Name = @name,
              Gender = @gender,
              PhoneNumber = @phoneNumber,
              Major = @major,
              RecordedCreditHours = @recordedCreditHours,
              CompletedCreditHours = @completedCreditHours,
              CGPA = @cgpa
          OUTPUT INSERTED.*
          WHERE StudentID = @id
        `);

      await transaction.commit();
      res.json(result.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(err.message.includes('not found') ? 404 : 400)
      .json({ message: err.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if student exists first
      const studentCheck = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Students WHERE StudentID = @id');
      
      if (studentCheck.recordset.length === 0) {
        throw new Error('Student not found');
      }

      // Check if student has any registrations
      const checkResult = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) as count FROM Registrations WHERE StudentID = @id');
      
      const hasRegistrations = checkResult.recordset[0].count > 0;

      // Delete registrations first if they exist
      if (hasRegistrations) {
        await new sql.Request(transaction)
          .input('id', sql.Int, req.params.id)
          .query('DELETE FROM Registrations WHERE StudentID = @id');
      }

      // Delete student
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Students WHERE StudentID = @id');

      await transaction.commit();
      res.json({ 
        message: 'Student deleted successfully',
        hadRegistrations: hasRegistrations
      });
    } catch (err) {
      console.error("Transaction error:", err);
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(err.message === 'Student not found' ? 404 : 500)
      .json({ message: err.message || 'Internal server error' });
  }
});

module.exports = router; 