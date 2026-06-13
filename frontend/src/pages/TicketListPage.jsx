import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTickets, getStats } from '../services/ticketService.js';
import { STATUSES, PRIORITIES } from '../utils/constants.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import useInterval from '../hooks/useInterval.js';
import { useToast } from '../components/ToastProvider.jsx';
import StatsBar from '../components/StatsBar.jsx';
import TicketCard from '../components/TicketCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/States.jsx';

const POLL_MS = 5000;
const PAGE_SIZE = 6;

/**
 * Lightweight signature used by the polling loop to detect "real" changes
 * vs. just freshly-fetched objects. We deliberately ignore createdAt/agent
 * so a re-fetch with no changes never flags a diff.
 */
function signatureFor(list) {
  return list
    .map(
      (t) =>
        `${t._id}:${t.status}:${t.priority}:${t.version}:${t.comments?.length || 0}:${t.slaState}`
    )
    .join('|');
}

function countDiffs(prev, next) {
  if (!prev || !next) return 0;
  const prevMap = new Map(prev.map((t) => [t._id, t]));
  let changed = 0;
  for (const t of next) {
    const p = prevMap.get(t._id);
    if (!p) {
      changed += 1;
      continue;
    }
    if (
      p.status !== t.status ||
      p.priority !== t.priority ||
      p.version !== t.version ||
      (p.comments?.length || 0) !== (t.comments?.length || 0) ||
      p.slaState !== t.slaState
    ) {
      changed += 1;
    }
  }
  return changed;
}

export default function TicketListPage() {
  const toast = useToast();

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(filters.search, 500);

  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // signature used to detect changes during silent background polls
  const signatureRef = useRef('');

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          status: filters.status,
          priority: filters.priority,
          sort: filters.sort,
          search: debouncedSearch.trim(),
        };
        const [listRes, statsRes] = await Promise.all([listTickets(params), getStats()]);
        setStats(statsRes);

        if (silent) {
          const nextSig = signatureFor(listRes.tickets);
          if (nextSig !== signatureRef.current) {
            const diffs = countDiffs(data?.tickets || [], listRes.tickets);
            if (diffs > 0) {
              toast.info(`${diffs} ticket${diffs === 1 ? '' : 's'} updated`);
            }
            signatureRef.current = nextSig;
            setData(listRes);
          }
        } else {
          signatureRef.current = signatureFor(listRes.tickets);
          setData(listRes);
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to load tickets';
        if (silent) {
          // Don't disrupt the UI on a background failure - just log it.
          console.warn('[poll] failed:', msg);
        } else {
          setError(msg);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, filters.status, filters.priority, filters.sort, debouncedSearch, data, toast]
  );

  // initial load + whenever filters/page change
  useEffect(() => {
    fetchData({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.status, filters.priority, filters.sort, debouncedSearch]);

  // live polling every 5s without touching page/scroll/dropdowns
  useInterval(() => fetchData({ silent: true }), POLL_MS);

  // Whenever a filter changes, reset to page 1 (but search debounce handles itself)
  function updateFilter(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  }

  function updateSearch(value) {
    setFilters((f) => ({ ...f, search: value }));
    setPage(1);
  }

  const tickets = data?.tickets || [];
  const totalPages = data?.totalPages || 1;
  const totalTickets = data?.totalTickets || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tickets</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${totalTickets} ticket${totalTickets === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          + New Ticket
        </Link>
      </div>

      <StatsBar stats={stats} loading={loading && !stats} />

      <Filters filters={filters} onChange={updateFilter} onSearch={updateSearch} />

      {loading && !data ? (
        <LoadingSkeleton count={PAGE_SIZE} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchData({ silent: false })} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description="Try adjusting your filters or create a new ticket to get started."
          action={
            <Link to="/tickets/new" className="btn-primary">
              + Create Ticket
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {tickets.map((t) => (
              <TicketCard key={t._id} ticket={t} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Filters({ filters, onChange, onSearch }) {
  return (
    <div className="card grid gap-3 p-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
        <input
          className="input"
          placeholder="Search title or description…"
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
        <select
          className="input"
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
        <select
          className="input"
          value={filters.priority}
          onChange={(e) => onChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-4 flex items-center justify-end gap-2">
        <label className="text-xs font-medium text-slate-500">Sort by</label>
        <select
          className="input max-w-[180px]"
          value={filters.sort}
          onChange={(e) => onChange('sort', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority (High → Low)</option>
        </select>
      </div>
    </div>
  );
}
