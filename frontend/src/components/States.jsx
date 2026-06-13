export function LoadingSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse p-5">
          <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
          <div className="mb-2 h-3 w-1/2 rounded bg-slate-200" />
          <div className="mb-4 h-3 w-1/3 rounded bg-slate-200" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-2xl">
        📭
      </div>
      <div className="mb-1 text-lg font-semibold text-slate-900">{title}</div>
      {description && <div className="mb-4 max-w-sm text-sm text-slate-500">{description}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-2xl">
        ⚠️
      </div>
      <div className="mb-1 text-lg font-semibold text-slate-900">{title}</div>
      {message && <div className="mb-4 max-w-md text-sm text-slate-500">{message}</div>}
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
