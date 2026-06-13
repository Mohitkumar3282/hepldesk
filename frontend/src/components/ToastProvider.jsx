import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

/** Tiny dependency-free toast system used by the whole app. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      const item = {
        id,
        type: toast.type || 'info',
        message: toast.message,
        duration: toast.duration ?? 3500,
      };
      setToasts((prev) => [...prev, item]);
      if (item.duration > 0) {
        setTimeout(() => remove(id), item.duration);
      }
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      show,
      remove,
      success: (msg, opts) => show({ ...opts, type: 'success', message: msg }),
      error: (msg, opts) => show({ ...opts, type: 'error', message: msg }),
      info: (msg, opts) => show({ ...opts, type: 'info', message: msg }),
    }),
    [show, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto card flex items-start gap-3 border-l-4 px-4 py-3 text-sm shadow-md ${
              t.type === 'success'
                ? 'border-emerald-500'
                : t.type === 'error'
                ? 'border-red-500'
                : 'border-brand-500'
            }`}
          >
            <div className="flex-1">{t.message}</div>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
