const Agent = require('../models/Agent');

const DEFAULT_AGENTS = [
  { name: 'Riya', maxLoad: 3 },
  { name: 'Karan', maxLoad: 4 },
  { name: 'Dev', maxLoad: 5 },
];

/**
 * Ensures the default agents exist. Runs on startup. Idempotent - never
 * duplicates existing agents and never overwrites their maxLoad.
 */
async function seedAgents() {
  const existing = await Agent.find({ name: { $in: DEFAULT_AGENTS.map((a) => a.name) } });
  const existingNames = new Set(existing.map((a) => a.name));
  const missing = DEFAULT_AGENTS.filter((a) => !existingNames.has(a.name));
  if (missing.length === 0) return [];
  const inserted = await Agent.insertMany(missing);
  console.log(`[seeder] Inserted ${inserted.length} agents: ${inserted.map((a) => a.name).join(', ')}`);
  return inserted;
}

module.exports = { seedAgents };
