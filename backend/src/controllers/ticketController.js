const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { validateCreateTicket, validateComment } = require('../utils/validators');
const {
  TRANSITIONS,
  PRIORITY_RANK,
  STATUSES,
  PRIORITIES,
} = require('../utils/constants');
const { getSlaState, getSlaDeadline } = require('../utils/sla');
const { assignNewTicket, assignFromQueueIfPossible } = require('../services/assignmentService');
const { maybeEscalate, maybeEscalateMany } = require('../services/escalationService');

const POPULATE_AGENT = { path: 'assignedAgent', select: 'name maxLoad' };

/**
 * Decorate a Mongoose ticket doc with derived SLA fields for the API.
 */
function serialize(ticket) {
  if (!ticket) return ticket;
  const obj = ticket.toObject ? ticket.toObject() : ticket;
  obj.slaState = getSlaState(obj);
  obj.slaDeadline = getSlaDeadline(obj);
  return obj;
}

/**
 * POST /api/tickets
 * Validates payload, auto-assigns an agent (or queues), and returns the ticket.
 */
async function createTicket(req, res, next) {
  try {
    const { valid, errors } = validateCreateTicket(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });

    const { title, description, category, priority } = req.body;

    const ticket = new Ticket({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'Open',
      version: 1,
      history: [{ action: 'created', message: 'Ticket created' }],
    });

    await assignNewTicket(ticket);
    await ticket.save();
    await ticket.populate(POPULATE_AGENT);

    res.status(201).json(serialize(ticket));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets
 * Supports status / priority / search filters, sort and pagination. Also
 * triggers lazy SLA escalation for any breached active tickets it returns.
 */
async function listTickets(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.priority && PRIORITIES.includes(req.query.priority)) {
      filter.priority = req.query.priority;
    }
    if (req.query.search && req.query.search.trim()) {
      const term = req.query.search.trim();
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const sortKey = req.query.sort || 'newest';
    let docs;
    const totalTickets = await Ticket.countDocuments(filter);

    if (sortKey === 'priority') {
      // Priority is a string enum, so we use an aggregation to rank+sort.
      docs = await Ticket.aggregate([
        { $match: filter },
        {
          $addFields: {
            _priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { _priorityRank: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
      // Re-hydrate as full documents so escalation can save() if needed.
      const ids = docs.map((d) => d._id);
      docs = await Ticket.find({ _id: { $in: ids } }).populate(POPULATE_AGENT);
      docs.sort((a, b) => {
        const diff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (diff !== 0) return diff;
        return b.createdAt - a.createdAt;
      });
    } else {
      const sortDir = sortKey === 'oldest' ? 1 : -1;
      docs = await Ticket.find(filter)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit)
        .populate(POPULATE_AGENT);
    }

    await maybeEscalateMany(docs);

    const totalPages = Math.max(Math.ceil(totalTickets / limit), 1);
    res.json({
      tickets: docs.map(serialize),
      totalPages,
      totalTickets,
      page,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets/stats
 * Single aggregation pipeline returning status and priority counts.
 */
async function getStats(req, res, next) {
  try {
    const [result] = await Ticket.aggregate([
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          priorityCounts: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        },
      },
    ]);

    const toMap = (arr) => arr.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
    res.json({
      statusCounts: toMap(result?.statusCounts || []),
      priorityCounts: toMap(result?.priorityCounts || []),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets/:id
 * Returns the full ticket. Lazily escalates if appropriate.
 */
async function getTicket(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const ticket = await Ticket.findById(req.params.id).populate(POPULATE_AGENT);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await maybeEscalate(ticket);
    res.json(serialize(ticket));
  } catch (err) {
    next(err);
  }
}

/**
 * Build a conflict response payload when client `version` doesn't match.
 */
async function conflictResponse(res, ticket) {
  await ticket.populate(POPULATE_AGENT);
  return res.status(409).json({
    message: 'Version conflict',
    currentTicket: serialize(ticket),
  });
}

/**
 * PATCH /api/tickets/:id/status
 * Body: { status, version }
 * Enforces the status machine + optimistic locking. Frees up the agent
 * by pulling from the queue when a ticket becomes Resolved or Closed.
 */
async function updateStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { status, version } = req.body || {};
    if (typeof version !== 'number') {
      return res.status(400).json({ message: 'version is required' });
    }
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.version !== version) return conflictResponse(res, ticket);

    const allowed = TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    const previous = ticket.status;
    ticket.status = status;
    ticket.version += 1;
    ticket.history.push({
      action: 'status_changed',
      message: `Status changed from ${previous} to ${status}`,
    });
    await ticket.save();

    // If the agent has freed up, pull from the queue.
    if (status === 'Resolved' || status === 'Closed') {
      await assignFromQueueIfPossible();
    }

    await ticket.populate(POPULATE_AGENT);
    res.json(serialize(ticket));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tickets/:id/comments
 * Body: { text, version }
 * Rejects comments on Closed tickets. Increments version + writes history.
 */
async function addComment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { text, version } = req.body || {};
    if (typeof version !== 'number') {
      return res.status(400).json({ message: 'version is required' });
    }
    const { valid, errors } = validateComment({ text });
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets cannot receive comments' });
    }

    if (ticket.version !== version) return conflictResponse(res, ticket);

    ticket.comments.push({ text: text.trim() });
    ticket.version += 1;
    ticket.history.push({
      action: 'comment_added',
      message: 'New comment added',
    });
    await ticket.save();
    await ticket.populate(POPULATE_AGENT);

    res.status(201).json(serialize(ticket));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicket,
  listTickets,
  getStats,
  getTicket,
  updateStatus,
  addComment,
};
