export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = pageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className="btn-secondary px-3 py-1.5 text-xs"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              p === page
                ? 'bg-brand-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        className="btn-secondary px-3 py-1.5 text-xs"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function pageNumbers(current, total) {
  const out = [];
  const push = (n) => out.push(n);
  const window = 1;

  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      push(p);
    } else if (out[out.length - 1] !== '…') {
      push('…');
    }
  }
  return out;
}
