const sql = require("mssql/msnodesqlv8");
require('dotenv').config();

const config = {
  connectionString: `Driver={ODBC Driver 18 for SQL Server};Trusted_Connection=yes;TrustServerCertificate=yes;Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};`,
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('Database connection error:', err);
});

module.exports = {
  sql,
  pool,
  poolConnect
}; 