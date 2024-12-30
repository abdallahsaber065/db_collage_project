const serverless = require('serverless-http');
require('dotenv').config();

const { poolConnect } = require('../../src/db');
const { createApp } = require('../../src/app');

const app = createApp();
let dbReady = false;

async function ensureDbConnection() {
  if (!dbReady) {
    await poolConnect;
    dbReady = true;
  }
}

module.exports.handler = async (event, context) => {
  await ensureDbConnection();
  const handler = serverless(app);
  return handler(event, context);
};
