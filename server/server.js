const express = require('express');
const cors = require('cors');
const { poolConnect } = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Routes
const studentsRouter = require('./routes/students');
const facultyRouter = require('./routes/faculty');
const coursesRouter = require('./routes/courses');
const departmentsRouter = require('./routes/departments');
const registrationsRouter = require('./routes/registrations');
const lecturesRouter = require('./routes/lectures');
const labsRouter = require('./routes/labs');

app.use('/api/students', studentsRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/lectures', lecturesRouter);
app.use('/api/labs', labsRouter);

// Test Database Connection
poolConnect
  .then(() => {
    console.log("Connected to SQL Server");
  })
  .catch(err => {
    console.error("Database connection failed: ", err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});