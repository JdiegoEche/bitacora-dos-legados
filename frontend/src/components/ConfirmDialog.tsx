// ─── Confirm Dialog ──────────────────────────────────────────────────────────
// Replaces native window.confirm with a styled modal matching the app design.

interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Main warning message */
  message: string;
  /** Optional extra context (e.g. "3 preparaciones serán eliminadas") */
  details?: string;
  /** Label for the confirm button (default: "Eliminar") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancelar") */
  cancelLabel?: string;
  /** Visual variant for the confirm button */
  variant?: 'danger' | 'default';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or clicks outside */
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  details,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">
          {variant === 'danger' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>

        {details && <p className="confirm-details">{details}</p>}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : ''}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
