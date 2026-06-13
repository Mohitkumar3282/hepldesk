const { SLA_HOURS } = require('./constants');

/**
 * Returns the SLA deadline for a ticket as a Date.
 * Deadline = createdAt + slaHours(priority).
 */
function getSlaDeadline(ticket) {
  const hours = SLA_HOURS[ticket.priority] ?? SLA_HOURS.Medium;
  const created = new Date(ticket.createdAt).getTime();
  return new Date(created + hours * 60 * 60 * 1000);
}

/**
 * Returns one of: 'ok' | 'at_risk' | 'breached'.
 * - breached: deadline has passed
 * - at_risk: >=75% of the SLA window elapsed but deadline not yet passed
 * - ok: otherwise
 */
function getSlaState(ticket) {
  const hours = SLA_HOURS[ticket.priority] ?? SLA_HOURS.Medium;
  const totalMs = hours * 60 * 60 * 1000;
  const created = new Date(ticket.createdAt).getTime();
  const elapsed = Date.now() - created;

  if (elapsed >= totalMs) return 'breached';
  if (elapsed / totalMs >= 0.75) return 'at_risk';
  return 'ok';
}

module.exports = { getSlaDeadline, getSlaState };
