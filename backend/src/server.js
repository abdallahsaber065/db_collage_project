require('dotenv').config();

const { poolConnect } = require('./db');
const { createApp } = require('./app');

const app = createApp();

poolConnect
  .then(() => {
    console.log('Connected to PostgreSQL');
  })
  .catch((err) => {
    console.error('Database connection failed: ', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
