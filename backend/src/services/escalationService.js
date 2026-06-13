const { getSlaState } = require('../utils/sla');
const { ACTIVE_STATUSES, NEXT_PRIORITY } = require('../utils/constants');

/**
 * If the ticket is breached, active, and has never been escalated, bump its
 * priority by one level and log a history entry. Mutates the ticket doc and
 * saves it. Returns true when an escalation occurred.
 *
 * This is invoked lazily on reads instead of via a cron job.
 */
async function maybeEscalate(ticket) {
  if (!ticket) return false;
  if (ticket.priorityEscalated) return false;
  if (!ACTIVE_STATUSES.includes(ticket.status)) return false;

  const state = getSlaState(ticket);
  if (state !== 'breached') return false;

  const next = NEXT_PRIORITY[ticket.priority];
  if (!next) return false;

  ticket.priority = next;
  ticket.priorityEscalated = true;
  ticket.history.push({
    action: 'sla_escalation',
    message: 'Priority auto escalated due to SLA breach',
  });
  await ticket.save();
  return true;
}

/**
 * Run `maybeEscalate` against an array of ticket docs. Used by the list
 * endpoint so escalations happen on read without a cron.
 */
async function maybeEscalateMany(tickets) {
  for (const t of tickets) await maybeEscalate(t);
}

module.exports = { maybeEscalate, maybeEscalateMany };
