const express = require('express');
const cors = require('cors');

const studentsRouter = require('./routes/students');
const facultyRouter = require('./routes/faculty');
const coursesRouter = require('./routes/courses');
const departmentsRouter = require('./routes/departments');
const registrationsRouter = require('./routes/registrations');
const lecturesRouter = require('./routes/lectures');
const labsRouter = require('./routes/labs');

function createApp() {
  const app = express();
  const previewMode = process.env.PREVIEW_MODE === 'true';

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, previewMode });
  });

  if (previewMode) {
    app.use('/api', (req, res, next) => {
      if (req.method === 'GET') {
        return next();
      }
      return res.status(403).json({
        message: 'Preview mode is read-only. Guests can browse data but cannot modify it.',
      });
    });
  }

  app.use('/api/students', studentsRouter);
  app.use('/api/faculty', facultyRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/departments', departmentsRouter);
  app.use('/api/registrations', registrationsRouter);
  app.use('/api/lectures', lecturesRouter);
  app.use('/api/labs', labsRouter);

  // Legacy alias for old links.
  app.use('/api/employees', facultyRouter);

  return app;
}

module.exports = { createApp };
