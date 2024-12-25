const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const dbConfig = {
  connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER};Database=University;Trusted_Connection=yes;TrustServerCertificate=yes;`
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('SQL Pool Error: ', err);
});

module.exports = {
  sql,
  pool,
  poolConnect
}; 