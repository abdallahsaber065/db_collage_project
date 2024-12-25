const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../db');

// Get labs by course ID
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('courseId', sql.Int, req.query.courseId)
      .query(`
        SELECT 
          LabID,
          CourseID,
          InstructorID,
          Day,
          CONVERT(varchar(5), StartTime, 108) as StartTime,
          CONVERT(varchar(5), EndTime, 108) as EndTime
        FROM Labs 
        WHERE CourseID = @courseId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching labs:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 