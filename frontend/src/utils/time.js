/**
 * Render a relative-time string like "5m ago" or "in 1h 20m".
 * Positive diffs (past) get "ago"; negative diffs (future) get "in ...".
 */
export function relativeTime(input) {
  if (!input) return '';
  const target = new Date(input).getTime();
  const diff = Date.now() - target;
  const abs = Math.abs(diff);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let value;
  if (abs < minute) value = 'just now';
  else if (abs < hour) value = `${Math.floor(abs / minute)}m`;
  else if (abs < day) value = `${Math.floor(abs / hour)}h`;
  else value = `${Math.floor(abs / day)}d`;

  if (value === 'just now') return value;
  return diff >= 0 ? `${value} ago` : `in ${value}`;
}

/**
 * Format an SLA countdown given a deadline. Returns
 * `{ label, breached }`. breached=true means deadline is in the past.
 */
export function countdown(deadline) {
  if (!deadline) return { label: '-', breached: false };
  const target = new Date(deadline).getTime();
  const diff = target - Date.now();
  const breached = diff <= 0;
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((abs % (60 * 1000)) / 1000);

  let label;
  if (hours > 0) label = `${hours}h ${minutes}m`;
  else if (minutes > 0) label = `${minutes}m ${seconds}s`;
  else label = `${seconds}s`;

  return { label: breached ? `${label} overdue` : `${label} left`, breached };
}

export function formatDateTime(input) {
  if (!input) return '';
  const d = new Date(input);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
