const CATEGORIES = ['Bug', 'Feature', 'Billing', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];
const ACTIVE_STATUSES = ['Open', 'In Progress'];

// SLA durations in hours
const SLA_HOURS = {
  Critical: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const NEXT_PRIORITY = {
  Low: 'Medium',
  Medium: 'High',
  High: 'Critical',
};

// Status machine: allowed transitions
const TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  // Queued tickets become Open automatically via assignment; not a manual transition.
  Queued: [],
};

module.exports = {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  ACTIVE_STATUSES,
  SLA_HOURS,
  PRIORITY_RANK,
  NEXT_PRIORITY,
  TRANSITIONS,
};
