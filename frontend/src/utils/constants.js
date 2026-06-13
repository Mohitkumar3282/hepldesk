export const CATEGORIES = ['Bug', 'Feature', 'Billing', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];
export const SELECTABLE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];

export const SLA_HOURS = {
  Critical: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

// Mirror of the backend status machine for picking next legal states.
export const TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Queued: [],
};

export const PRIORITY_COLORS = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

export const STATUS_COLORS = {
  Open: 'bg-sky-100 text-sky-700 border-sky-200',
  'In Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-200 text-slate-700 border-slate-300',
  Queued: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const CATEGORY_COLORS = {
  Bug: 'bg-rose-50 text-rose-700 border-rose-200',
  Feature: 'bg-violet-50 text-violet-700 border-violet-200',
  Billing: 'bg-blue-50 text-blue-700 border-blue-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const SLA_LABEL = {
  ok: 'On Track',
  at_risk: 'At Risk',
  breached: 'Breached',
};

export const SLA_COLORS = {
  ok: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  at_risk: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  breached: 'bg-red-100 text-red-700 border-red-200',
};
