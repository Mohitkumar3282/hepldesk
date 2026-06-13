const Agent = require('../models/Agent');
const { getActiveLoads } = require('../services/assignmentService');

/**
 * GET /api/agents
 * Returns all agents annotated with their current active workload.
 */
async function listAgents(req, res, next) {
  try {
    const [agents, loads] = await Promise.all([Agent.find().lean(), getActiveLoads()]);
    const decorated = agents.map((a) => ({
      ...a,
      activeTickets: loads.get(String(a._id)) || 0,
    }));
    res.json(decorated);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAgents };
