const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL or fall back to individual environment variables
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }
  // Fallback to individual variables for backward compatibility
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
  };
};

// establish connection pool to PostgreSQL
const pool = new Pool(getDatabaseConfig());

// warm up the pool so that poolConnect resolves once a connection has been
// successfully acquired and released.
const poolConnect = pool.connect().then(client => client.release()).catch(err => {
  console.error('PostgreSQL pool connection failed:', err);
});

pool.on('error', err => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// compatibility helpers to mimic a tiny portion of the mssql API used by
// existing route handlers.  This keeps the migration to Postgres small and
// allows most of the query logic to remain untouched.
/** @type {Partial<import('./index').SqlType>} */
const sql = {
  Int: 'int',
  VarChar: () => 'varchar',
  Date: 'date',
  Decimal: () => 'decimal'
};

class Transaction {
  constructor(pool) {
    this.pool = pool;
    this.client = null;
  }
  async begin() {
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
  }
  async commit() {
    if (this.client) {
      await this.client.query('COMMIT');
      this.client.release();
      this.client = null;
    }
  }
  async rollback() {
    if (this.client) {
      try {
        await this.client.query('ROLLBACK');
      } finally {
        this.client.release();
        this.client = null;
      }
    }
  }
  async query(text, params) {
    if (!this.client) {
      throw new Error('Transaction has not started');
    }
    return this.client.query(text, params);
  }
}

class Request {
  constructor(ctx) {
    this.ctx = ctx;
    this.params = [];
    this.map = {};
  }
  input(name, type, value) {
    this.map[name] = this.params.length + 1;
    this.params.push(value);
    return this;
  }
  async query(text) {
    const converted = text.replace(/@([a-zA-Z0-9_]+)/g, (_, key) => {
      const idx = this.map[key];
      if (!idx) {
        throw new Error(`Parameter ${key} not provided`);
      }
      return '$' + idx;
    });
    const res = await this.ctx.query(converted, this.params);
    return { recordset: mapRowsToLegacyKeys(res.rows) };
  }
}

const LEGACY_KEY_MAP = {
  studentid: 'StudentID',
  employeeid: 'EmployeeID',
  departmentid: 'DepartmentID',
  courseid: 'CourseID',
  prerequisiteid: 'PrerequisiteID',
  prerequisitename: 'PrerequisiteName',
  lectureid: 'LectureID',
  labid: 'LabID',
  roomnumber: 'RoomNumber',
  instructorid: 'InstructorID',
  registrationid: 'RegistrationID',
  registrationdate: 'RegistrationDate',
  studentname: 'StudentName',
  coursename: 'CourseName',
  lectureday: 'LectureDay',
  lecturestarttime: 'LectureStartTime',
  lectureendtime: 'LectureEndTime',
  labday: 'LabDay',
  labstarttime: 'LabStartTime',
  labendtime: 'LabEndTime',
  name: 'Name',
  gender: 'Gender',
  phonenumber: 'PhoneNumber',
  major: 'Major',
  recordedcredithours: 'RecordedCreditHours',
  completedcredithours: 'CompletedCreditHours',
  cgpa: 'CGPA',
  officelocation: 'OfficeLocation',
  position: 'Position',
  salary: 'Salary',
  hiredate: 'HireDate',
  credithours: 'CreditHours',
  day: 'Day',
  starttime: 'StartTime',
  endtime: 'EndTime',
  building: 'Building',
  capacity: 'Capacity',
  roomtype: 'RoomType',
  studentcount: 'StudentCount',
  facultycount: 'FacultyCount',
  employeecount: 'EmployeeCount',
  coursecount: 'CourseCount',
  lecturecount: 'LectureCount',
  labcount: 'LabCount',
  registrationcount: 'RegistrationCount',
  prerequisitecount: 'PrerequisiteCount',
  grade: 'Grade',
  email: 'Email',
  dateofbirth: 'DateOfBirth',
  enrollmentdate: 'EnrollmentDate',
  coursetype: 'CourseType',
  description: 'Description',
  prerequisites: 'Prerequisites'
};

function mapRowsToLegacyKeys(rows) {
  return rows.map((row) => {
    const mapped = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[LEGACY_KEY_MAP[key] || key] = value;
    }
    return mapped;
  });
}

sql.Transaction = Transaction;
sql.Request = Request;

// the pg Pool type doesn't include our helper, so use `any` to avoid
// type errors.  consumers will see the correct signature via our declaration
// file above.
/** @type {any} */ (pool).request = function () {
  return new Request(pool);
};

module.exports = {
  sql,
  pool,
  poolConnect,
}; 
