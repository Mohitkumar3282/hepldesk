import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge, CategoryBadge, SlaBadge } from './Badges.jsx';
import { relativeTime } from '../utils/time.js';

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket._id}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-brand-600">
          {ticket.title}
        </h3>
        <SlaBadge state={ticket.slaState} />
      </div>

      <p className="line-clamp-2 text-xs text-slate-500">{ticket.description}</p>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={ticket.category} />
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
            {ticket.assignedAgent?.name?.[0] || '—'}
          </span>
          <span>{ticket.assignedAgent?.name || 'Unassigned'}</span>
        </div>
        <span>{relativeTime(ticket.createdAt)}</span>
      </div>
    </Link>
  );
}
