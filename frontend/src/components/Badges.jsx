import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  CATEGORY_COLORS,
  SLA_COLORS,
  SLA_LABEL,
} from '../utils/constants.js';

function Pill({ className, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return <Pill className={PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700'}>{priority}</Pill>;
}

export function StatusBadge({ status }) {
  return <Pill className={STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'}>{status}</Pill>;
}

export function CategoryBadge({ category }) {
  return (
    <Pill className={CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700'}>{category}</Pill>
  );
}

export function SlaBadge({ state }) {
  return (
    <Pill className={SLA_COLORS[state] || 'bg-slate-100 text-slate-700'}>
      <span
        className={`mr-1 inline-block h-2 w-2 rounded-full ${
          state === 'ok' ? 'bg-emerald-500' : state === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
        }`}
      />
      {SLA_LABEL[state] || state}
    </Pill>
  );
}
