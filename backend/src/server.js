require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('./app');
const { seedAgents } = require('./seeders/agentSeeder');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/appzeto_helpdesk';

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log(`[mongo] Connected to ${MONGO_URI}`);

  await seedAgents();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] Appzeto Helpdesk API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[fatal] Failed to start server', err);
  process.exit(1);
});
