import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  exiting: boolean;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const TOAST_ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg className="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg className="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;
const EXIT_ANIM_MS = 200;

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId.current;

    setToasts((prev) => [...prev, { id, type, message, exiting: false }]);

    const dismissTimeout = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );

      const removeTimeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutsRef.current.delete(removeTimeout);
      }, EXIT_ANIM_MS);

      timeoutsRef.current.add(removeTimeout);
      timeoutsRef.current.delete(dismissTimeout);
    }, AUTO_DISMISS_MS);

    timeoutsRef.current.add(dismissTimeout);
  }, []);

  const success = useCallback(
    (msg: string) => addToast('success', msg),
    [addToast],
  );
  const error = useCallback(
    (msg: string) => addToast('error', msg),
    [addToast],
  );
  const info = useCallback(
    (msg: string) => addToast('info', msg),
    [addToast],
  );

  const value: ToastContextValue = { success, error, info };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
            role="alert"
          >
            {TOAST_ICONS[t.type]}
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
