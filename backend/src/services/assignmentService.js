const Agent = require('../models/Agent');
const Ticket = require('../models/Ticket');
const { ACTIVE_STATUSES } = require('../utils/constants');

/**
 * Compute active ticket counts per agent. Returns a Map<agentId, number>.
 * "Active" means status is Open or In Progress.
 */
async function getActiveLoads() {
  const rows = await Ticket.aggregate([
    { $match: { status: { $in: ACTIVE_STATUSES }, assignedAgent: { $ne: null } } },
    { $group: { _id: '$assignedAgent', count: { $sum: 1 } } },
  ]);
  const map = new Map();
  for (const row of rows) map.set(String(row._id), row.count);
  return map;
}

/**
 * Pick the best agent to take a new ticket, applying tie-breakers:
 *   1. lowest load percentage (active / maxLoad)
 *   2. fewest active tickets
 *   3. alphabetical name
 * Agents that are already at maxLoad are excluded.
 * Returns the chosen agent doc, or null if everyone is full.
 */
async function pickAgentForAssignment() {
  const [agents, loads] = await Promise.all([Agent.find().lean(), getActiveLoads()]);

  const candidates = agents
    .map((a) => {
      const active = loads.get(String(a._id)) || 0;
      return {
        agent: a,
        active,
        loadPct: active / a.maxLoad,
        full: active >= a.maxLoad,
      };
    })
    .filter((c) => !c.full);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.loadPct !== b.loadPct) return a.loadPct - b.loadPct;
    if (a.active !== b.active) return a.active - b.active;
    return a.agent.name.localeCompare(b.agent.name);
  });

  return candidates[0].agent;
}

/**
 * Assign a freshly-created ticket. Mutates the ticket doc in place but
 * does NOT save it - the caller controls persistence.
 */
async function assignNewTicket(ticket) {
  const agent = await pickAgentForAssignment();
  if (agent) {
    ticket.assignedAgent = agent._id;
    ticket.status = 'Open';
    ticket.history.push({
      action: 'assigned',
      message: `Ticket assigned to ${agent.name}`,
    });
  } else {
    ticket.assignedAgent = null;
    ticket.status = 'Queued';
    ticket.history.push({
      action: 'queued',
      message: 'All agents are at capacity. Ticket queued.',
    });
  }
  return ticket;
}

/**
 * When an agent frees up (a ticket becomes Resolved or Closed) try to pull
 * the oldest Queued ticket and assign it. May be called multiple times if
 * several slots open up.
 */
async function assignFromQueueIfPossible() {
  const queued = await Ticket.findOne({ status: 'Queued' }).sort({ createdAt: 1 });
  if (!queued) return null;

  const agent = await pickAgentForAssignment();
  if (!agent) return null;

  queued.assignedAgent = agent._id;
  queued.status = 'Open';
  queued.version += 1;
  queued.history.push({
    action: 'auto_assigned',
    message: `Auto assigned from queue to ${agent.name}`,
  });
  await queued.save();
  return queued;
}

module.exports = {
  getActiveLoads,
  pickAgentForAssignment,
  assignNewTicket,
  assignFromQueueIfPossible,
};
