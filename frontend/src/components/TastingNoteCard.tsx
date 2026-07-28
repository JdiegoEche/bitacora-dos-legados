import type { TastingNote } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ratingLabel(n: number | null): string {
  if (n == null) return '';
  return `Calificación: ${n}/5`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TastingNoteCardProps {
  note: TastingNote;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export default function TastingNoteCard({
  note,
  onEdit,
  onDelete,
  isDeleting,
}: TastingNoteCardProps) {
  return (
    <div className="note-card">
      <div className="note-attributes">
        {note.aroma && (
          <span>
            <strong>Aroma:</strong> {note.aroma}
          </span>
        )}
        {note.flavor && (
          <span>
            <strong>Sabor:</strong> {note.flavor}
          </span>
        )}
        {note.body && (
          <span>
            <strong>Cuerpo:</strong> {note.body}
          </span>
        )}
        {note.acidity && (
          <span>
            <strong>Acidez:</strong> {note.acidity}
          </span>
        )}
      </div>

      {note.freeText && <p className="note-text">{note.freeText}</p>}

      <div className="note-footer">
        <span className="note-rating">{ratingLabel(note.rating)}</span>
        <div className="note-footer-actions">
          <button
            onClick={() => onEdit(note.id)}
            className="btn btn-small btn-secondary"
            disabled={isDeleting}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="btn btn-small btn-danger"
            disabled={isDeleting}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
