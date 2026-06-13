import { STATUSES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants.js';

/**
 * Top dashboard widget that shows status + priority counts side by side.
 * Renders skeleton cells while `loading` is true.
 */
export default function StatsBar({ stats, loading }) {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-y-0 md:divide-x">
        <Section title="By Status">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatChip
                key={s}
                label={s}
                value={stats?.statusCounts?.[s] || 0}
                className={STATUS_COLORS[s]}
                loading={loading}
              />
            ))}
          </div>
        </Section>
        <Section title="By Priority">
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <StatChip
                key={p}
                label={p}
                value={stats?.priorityCounts?.[p] || 0}
                className={PRIORITY_COLORS[p]}
                loading={loading}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatChip({ label, value, className, loading }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${className}`}
    >
      <span>{label}</span>
      <span className="rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-bold">
        {loading ? '…' : value}
      </span>
    </div>
  );
}
