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


// Get lectures by course ID
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('courseId', sql.Int, req.query.courseId)
      .query(`
        SELECT 
          LectureID,
          CourseID,
          InstructorID,
          Day,
          TO_CHAR(StartTime, 'HH24:MI') as StartTime,
          TO_CHAR(EndTime, 'HH24:MI') as EndTime
        FROM Lectures 
        WHERE CourseID = @courseId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching lectures:", err);
    res.status(500).json({ error: getMessage(err) });
  }
});

module.exports = router; 