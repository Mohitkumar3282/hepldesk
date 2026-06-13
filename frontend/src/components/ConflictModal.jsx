import Modal from './Modal.jsx';
import { StatusBadge, PriorityBadge } from './Badges.jsx';

/**
 * Shown on a 409 response. Lets the user keep the server state or retry
 * their change on top of the latest version.
 */
export default function ConflictModal({ open, conflict, onClose, onTakeTheirs, onRetryMine }) {
  if (!conflict) return null;
  const { yourChange, serverState } = conflict;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="This ticket was changed by someone else"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-secondary" onClick={onTakeTheirs}>
            Take Theirs
          </button>
          <button className="btn-primary" onClick={onRetryMine}>
            Retry Mine On Top
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Someone updated this ticket while you were working on it. Pick which version to keep.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChangeColumn title="Your Change" change={yourChange} accent="border-brand-400" />
        <ChangeColumn title="Server State" change={serverState} accent="border-amber-400" />
      </div>
    </Modal>
  );
}

function ChangeColumn({ title, change, accent }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent}`}>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <dl className="space-y-2 text-sm">
        {change.status !== undefined && (
          <Row label="Status">
            <StatusBadge status={change.status} />
          </Row>
        )}
        {change.priority !== undefined && (
          <Row label="Priority">
            <PriorityBadge priority={change.priority} />
          </Row>
        )}
        {change.comment !== undefined && (
          <Row label="Comment">
            <span className="break-words">{change.comment}</span>
          </Row>
        )}
        {change.version !== undefined && (
          <Row label="Version">
            <span className="font-mono">{change.version}</span>
          </Row>
        )}
      </dl>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
