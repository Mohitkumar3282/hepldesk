import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getTicket,
  updateStatus as apiUpdateStatus,
  addComment as apiAddComment,
} from '../services/ticketService.js';
import { TRANSITIONS, SLA_HOURS } from '../utils/constants.js';
import { useToast } from '../components/ToastProvider.jsx';
import { PriorityBadge, StatusBadge, CategoryBadge, SlaBadge } from '../components/Badges.jsx';
import { LoadingSkeleton, ErrorState } from '../components/States.jsx';
import ConflictModal from '../components/ConflictModal.jsx';
import { countdown, formatDateTime, relativeTime } from '../utils/time.js';
import useNow from '../hooks/useNow.js';

export default function TicketDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Conflict resolution state. `pending` describes the mutation the user
  // tried last so we can replay it after "Retry Mine On Top".
  const [conflict, setConflict] = useState(null);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  /**
   * Centralised handler for the conflict flow. Wraps a mutation function so
   * we can replay it on "Retry Mine On Top" using the latest version.
   */
  async function runMutation(buildPayload, runner, snapshotForConflict) {
    const previous = ticket;
    try {
      const updated = await runner();
      setTicket(updated);
      return updated;
    } catch (err) {
      if (err?.response?.status === 409) {
        const serverTicket = err.response.data?.currentTicket;
        setTicket(previous);
        setConflict({
          serverTicket,
          yourChange: snapshotForConflict,
          serverState: {
            status: serverTicket?.status,
            priority: serverTicket?.priority,
            version: serverTicket?.version,
          },
          replay: async () => {
            const payload = buildPayload(serverTicket.version);
            return payload();
          },
        });
        return null;
      }
      setTicket(previous);
      const msg = err?.response?.data?.message || err.message || 'Update failed';
      toast.error(msg);
      throw err;
    }
  }

  async function changeStatus(nextStatus) {
    if (!ticket) return;
    const previous = ticket;
    // Optimistic UI: flip the status immediately, then call the API.
    setTicket({ ...ticket, status: nextStatus });

    const versionAtClick = ticket.version;
    const buildPayload = (version) => async () => {
      return apiUpdateStatus(ticket._id, nextStatus, version);
    };

    try {
      const updated = await runMutation(
        buildPayload,
        () => apiUpdateStatus(ticket._id, nextStatus, versionAtClick),
        { status: nextStatus, version: versionAtClick }
      );
      if (updated) {
        toast.success(`Status updated to ${updated.status}`);
      } else {
        // conflict path - restore prev until user decides
        setTicket(previous);
      }
    } catch {
      setTicket(previous);
    }
  }

  async function submitComment(text) {
    if (!ticket) return false;
    const versionAtClick = ticket.version;
    const buildPayload = (version) => async () => apiAddComment(ticket._id, text, version);
    try {
      const updated = await runMutation(
        buildPayload,
        () => apiAddComment(ticket._id, text, versionAtClick),
        { comment: text, version: versionAtClick }
      );
      if (updated) {
        toast.success('Comment added');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function handleTakeTheirs() {
    if (conflict?.serverTicket) setTicket(conflict.serverTicket);
    setConflict(null);
    toast.info('Loaded latest server state');
  }

  async function handleRetryMine() {
    if (!conflict) return;
    try {
      const result = await conflict.replay();
      if (result) {
        setTicket(result);
        toast.success('Your change was applied on top of the latest version');
      }
      setConflict(null);
    } catch (err) {
      // If still conflict, refresh and abort
      if (err?.response?.status === 409 && err.response.data?.currentTicket) {
        toast.error('Still conflicting. Showing the newest version.');
        setTicket(err.response.data.currentTicket);
      } else {
        const msg = err?.response?.data?.message || err.message || 'Retry failed';
        toast.error(msg);
      }
      setConflict(null);
    }
  }

  if (loading && !ticket) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton count={2} />
      </div>
    );
  }
  if (error && !ticket) {
    return <ErrorState message={error} onRetry={fetchTicket} />;
  }
  if (!ticket) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to tickets
        </Link>
        <button className="btn-secondary text-xs" onClick={fetchTicket}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TicketHeader ticket={ticket} onChangeStatus={changeStatus} />
          <DescriptionCard ticket={ticket} />
          <CommentsCard ticket={ticket} onSubmit={submitComment} />
        </div>
        <div className="space-y-4">
          <SlaCard ticket={ticket} />
          <MetaCard ticket={ticket} />
          <HistoryCard ticket={ticket} />
        </div>
      </div>

      <ConflictModal
        open={!!conflict}
        conflict={conflict}
        onClose={() => setConflict(null)}
        onTakeTheirs={handleTakeTheirs}
        onRetryMine={handleRetryMine}
      />
    </div>
  );
}

function TicketHeader({ ticket, onChangeStatus }) {
  const nextStates = TRANSITIONS[ticket.status] || [];
  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{ticket.title}</h1>
          <div className="mt-1 text-xs text-slate-500">
            Created {formatDateTime(ticket.createdAt)} ({relativeTime(ticket.createdAt)})
          </div>
        </div>
        <SlaBadge state={ticket.slaState} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={ticket.category} />
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Change Status
        </div>
        {nextStates.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No further transitions available for this status.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextStates.map((s) => (
              <button
                key={s}
                onClick={() => onChangeStatus(s)}
                className="btn-secondary text-xs"
              >
                → {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DescriptionCard({ ticket }) {
  return (
    <div className="card p-5">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        Description
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {ticket.description}
      </p>
    </div>
  );
}

function CommentsCard({ ticket, onSubmit }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isClosed = ticket.status === 'Closed';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 3) {
      setError('Comment must be at least 3 characters');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(text.trim());
    setSubmitting(false);
    if (ok) setText('');
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Comments
        </div>
        <span className="text-xs text-slate-400">{ticket.comments?.length || 0} total</span>
      </div>
      <div className="space-y-3">
        {(ticket.comments || []).length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            No comments yet.
          </div>
        ) : (
          ticket.comments.map((c) => (
            <div
              key={c._id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <div className="whitespace-pre-wrap">{c.text}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {formatDateTime(c.createdAt)} · {relativeTime(c.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-100 pt-4">
        {isClosed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Closed tickets cannot receive comments
          </div>
        ) : (
          <>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Write a comment (minimum 3 characters)…"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
            />
            {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
            <div className="mt-2 flex justify-end">
              <button type="submit" className="btn-primary text-xs" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function SlaCard({ ticket }) {
  // Tick every second so the countdown stays live without re-fetching.
  useNow(1000);
  const isActive = ticket.status === 'Open' || ticket.status === 'In Progress';
  const cd = countdown(ticket.slaDeadline);
  const accent =
    ticket.slaState === 'ok'
      ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
      : ticket.slaState === 'at_risk'
      ? 'border-yellow-400 text-yellow-700 bg-yellow-50'
      : 'border-red-400 text-red-700 bg-red-50';

  return (
    <div className={`card border-l-4 p-5 ${accent}`}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-70">
        SLA Countdown
      </div>
      <div className="text-2xl font-bold tabular-nums">{isActive ? cd.label : '—'}</div>
      <div className="mt-2 text-xs opacity-80">
        SLA window: {SLA_HOURS[ticket.priority]}h for {ticket.priority} priority
      </div>
      <div className="text-xs opacity-80">Deadline: {formatDateTime(ticket.slaDeadline)}</div>
      {ticket.priorityEscalated && (
        <div className="mt-2 inline-flex items-center rounded bg-white/60 px-2 py-0.5 text-[11px] font-semibold">
          Priority auto-escalated
        </div>
      )}
    </div>
  );
}

function MetaCard({ ticket }) {
  return (
    <div className="card p-5 text-sm">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Assignment
      </div>
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
          {ticket.assignedAgent?.name?.[0] || '—'}
        </div>
        <div>
          <div className="font-medium text-slate-900">
            {ticket.assignedAgent?.name || 'Unassigned'}
          </div>
          {ticket.assignedAgent?.maxLoad && (
            <div className="text-xs text-slate-500">Max load: {ticket.assignedAgent.maxLoad}</div>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
        <div>
          <div className="text-slate-400">Version</div>
          <div className="font-mono">{ticket.version}</div>
        </div>
        <div>
          <div className="text-slate-400">Updated</div>
          <div>{relativeTime(ticket.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ ticket }) {
  const items = [...(ticket.history || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return (
    <div className="card p-5">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Timeline
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-slate-500">No history yet.</div>
      ) : (
        <ol className="relative space-y-3 border-l border-slate-200 pl-4">
          {items.map((h) => (
            <li key={h._id} className="relative">
              <span className="absolute -left-[21px] top-1 grid h-3 w-3 place-items-center rounded-full border-2 border-white bg-brand-500" />
              <div className="text-sm text-slate-800">{h.message}</div>
              <div className="text-[11px] text-slate-400">
                {formatDateTime(h.createdAt)} · {relativeTime(h.createdAt)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
